import { describe, expect, it } from "vitest";
import { ContractStatusCodes } from "@upmind-automation/types";
import { compact, every, filter, find, map, some } from "lodash-es";
import type { MockDataset } from "~/portal/mock/types";
import { hostgridConfig } from "~/portal/config/hostgrid";
import { MOCK_ACTION, mockActionValue } from "~/portal/mock/actions";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import {
  catchAllRedirect,
  groupProductItems,
  productAreaNavItems,
  productRootRedirect,
  setupAreaRedirect
} from "~/portal/mock/selectors";
import { defineProductGroup, resolveCatchAll } from "~/portal/routes";

/**
 * Legacy's product row is one component wherever the list appears, so the
 * Products page must offer what the dashboard rows offer — the parity gaps
 * `docs/legacy-parity-products.md` records.
 */

const products = defineProductGroup({ slug: "products", label: "Products" });

function clone(): MockDataset {
  return structuredClone(HOSTGRID_MOCK_DATASET);
}

describe("the products listing carries legacy's row controls", () => {
  const items = groupProductItems(clone(), { groupSlug: "products" });

  it("gives every row legacy's one CTA and no overflow menu", () => {
    expect(items.length).toBeGreaterThan(0);
    expect(
      every(items, item =>
        /^(Manage|Complete setup)$/.test(item.action?.label ?? "")
      )
    ).toBe(true);
    expect(every(items, item => item.moreActions === undefined)).toBe(true);
  });

  it("marks a product the provider still owes a request on", () => {
    const owed = find(
      HOSTGRID_MOCK_DATASET.products,
      product => (product.provisioning.unresolvedRequests ?? 0) > 0
    );
    if (owed === undefined) throw new Error("seed has no open request");
    const row = find(items, { id: owed.id });
    const marker = find(row?.tags, tag => /open request/.test(tag.label));
    expect(marker?.tone).toBe("danger");
    expect(marker?.action?.value).toBe(
      mockActionValue(MOCK_ACTION.VIEW_PRODUCT, owed.id)
    );
    expect(
      some(
        items,
        row =>
          row.id !== owed.id &&
          some(row.tags, tag => /open request/.test(tag.label))
      )
    ).toBe(false);
  });
});

describe("legacy's list presentation", () => {
  it("dims a cancelled product and leaves a running one alone", () => {
    const data = clone();
    const cancelled = groupProductItems(data, {
      groupSlug: "products",
      status: "cancelled"
    });
    expect(cancelled.length).toBeGreaterThan(0);
    expect(every(cancelled, item => item.isInactive === true)).toBe(true);
    const running = groupProductItems(data, { groupSlug: "products" });
    expect(some(running, item => item.isInactive === true)).toBe(false);
  });

  it("keeps a renamed product's original name in view", () => {
    const renamed = find(
      HOSTGRID_MOCK_DATASET.products,
      product => product.originalName !== undefined
    );
    if (renamed === undefined) throw new Error("seed has no renamed product");
    const row = find(
      groupProductItems(clone(), { groupSlug: "products", status: "all" }),
      { id: renamed.id }
    );
    expect(row?.description).toContain(`formerly ${renamed.originalName}`);
  });
});

describe("a product still owed its setup opens on the Setup tab", () => {
  const data = clone();
  const pending = find(data.products, {
    status: ContractStatusCodes.AWAITING_ACTIVATION
  });
  const running = find(data.products, { status: ContractStatusCodes.ACTIVE });
  if (pending === undefined || running === undefined)
    throw new Error("seed lacks a pending or a running product");
  const rootOf = (id: string) =>
    ({ kind: "product-detail", group: products, id }) as const;

  // The root is a redirect POSITION, never a page (legacy's `ClientCProd`), so
  // both answer with an area. Overview keeps its own address — pointed at the
  // root, the area nav's Overview tab was swallowed here and read as dead.
  it("sends the pending product to setup, and the running one to its overview", () => {
    expect(productRootRedirect(data, rootOf(pending.id))).toBe(
      `/products/${pending.id}/setup`
    );
    expect(productRootRedirect(data, rootOf(running.id))).toBe(
      `/products/${running.id}/overview`
    );
  });
});

describe("a finished product's setup URL falls back to its overview", () => {
  const data = clone();
  const pending = find(data.products, {
    status: ContractStatusCodes.AWAITING_ACTIVATION
  });
  const running = find(data.products, { status: ContractStatusCodes.ACTIVE });
  if (pending === undefined || running === undefined) {
    throw new Error("seed lacks a pending or a running product");
  }
  const setupOf = (id: string) =>
    ({
      kind: "product-action-area",
      group: products,
      id,
      area: "setup"
    }) as const;

  it("sends a running product back to its overview", () => {
    expect(setupAreaRedirect(data, setupOf(running.id))).toBe(
      `/products/${running.id}/overview`
    );
  });

  it("leaves a product still awaiting setup on the tab", () => {
    expect(setupAreaRedirect(data, setupOf(pending.id))).toBeUndefined();
  });

  it("touches no other area, and no unknown product", () => {
    expect(
      setupAreaRedirect(data, {
        kind: "product-action-area",
        group: products,
        id: running.id,
        area: "billing"
      })
    ).toBeUndefined();
    expect(setupAreaRedirect(data, setupOf("prod-nowhere"))).toBeUndefined();
  });
});

/**
 * The area nav may not offer a destination the catch-all redirect refuses.
 * Overview used to point at the product ROOT, which `productRootRedirect`
 * sends straight back to Setup while setup is owed — so on a pending product
 * the tab moved nowhere and read as broken. Every tab now owns an address.
 */
describe("every product area tab reaches the page it names", () => {
  const data = clone();
  const pending = find(data.products, {
    status: ContractStatusCodes.AWAITING_ACTIVATION
  });
  const running = find(data.products, { status: ContractStatusCodes.ACTIVE });
  if (pending === undefined || running === undefined) {
    throw new Error("seed lacks a pending or a running product");
  }
  const settles = (to: string): boolean => {
    const resolution = resolveCatchAll(hostgridConfig, compact(to.split("/")));
    return catchAllRedirect(data, resolution, {}) === undefined;
  };

  it.each([
    ["a product still owed its setup", () => pending],
    ["a running product", () => running]
  ])("leaves no dead tab on %s", (_case, read) => {
    const tabs = productAreaNavItems(data, {
      groupSlug: "products",
      productId: read().id
    });

    expect(tabs.length).toBeGreaterThan(0);
    expect(some(tabs, tab => tab.label === "Overview")).toBe(true);
    // Named, so a failure says WHICH tab goes nowhere.
    const dead = map(
      filter(tabs, tab => !settles(tab.to ?? "")),
      "label"
    );
    expect(dead).toEqual([]);
  });
});
