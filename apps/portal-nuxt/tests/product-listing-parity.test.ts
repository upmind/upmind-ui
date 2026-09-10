import { describe, expect, it } from "vitest";
import { ContractStatusCodes } from "@upmind-automation/types";
import { every, find, some } from "lodash-es";
import type { MockDataset } from "~/portal/mock/types";
import { MOCK_ACTION, mockActionValue } from "~/portal/mock/actions";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { groupProductItems, setupAreaRedirect } from "~/portal/mock/selectors";
import { defineProductGroup } from "~/portal/routes";

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

  it("gives every row its button and its overflow menu", () => {
    expect(items.length).toBeGreaterThan(0);
    expect(every(items, item => item.action?.label !== undefined)).toBe(true);
    expect(every(items, item => (item.moreActions?.length ?? 0) >= 2)).toBe(
      true
    );
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
      `/products/${running.id}`
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
