// -----------------------------------------------------------------------------
/**
 * @module tests/product-detail-chrome
 * @description Gap doc §2 "Detail — shared chrome": the billboard's status
 * tags, the condition banner's contextual CTA, the sidebar summary, the About
 * panel and the assistance CTA — the chrome every product area sits inside.
 *
 * The banner is graded by WALKING the whole seed rather than by naming the two
 * products that happen to carry a lifecycle marker: each branch is asserted
 * from the product's own data, and the sweep is what notices a branch the
 * seed stopped reaching. Gate branches are graded differentially (a clone
 * sitting on the other branch), because a gate proven only by the brand that
 * ships it is a seed read-back.
 */

import { describe, expect, it } from "vitest";
import { ContractStatusCodes } from "@upmind-automation/types";
import { assign, filter, find, includes, map, some, values } from "lodash-es";
import type { DataRouteContext } from "~/portal/mock/injection";
import type { MockBrandFeatures, MockDataset } from "~/portal/mock/types";
import type { MockProduct } from "~/portal/mock/types";
import type { SpecModuleItem } from "~/portal/modules/spec/types";
import { MOCK_ACTION, mockActionValue } from "~/portal/mock/actions";
import { HOSTGRID_MOCK_DATASET } from "~/portal/mock/hostgrid";
import { HOSTGRID_MINIMAL_MOCK_DATASET } from "~/portal/mock/hostgrid-minimal";
import {
  groupProductItems,
  isSupportEnabled,
  productAboutMarkdown,
  productAreaNavItems,
  productBillboardItems,
  productConditionAction,
  productConditionMessage,
  productConditionTitle,
  productConditionTone,
  productHasAbout,
  productHasCondition,
  productSpecItems,
  productSupportAction
} from "~/portal/mock/selectors";
import { MOCK_RENEWAL_TERM } from "~/portal/mock/types";

const GROUP_SLUG = "products";

const ACTIVE_PRODUCT = "prod-analytics";
/** A product renewing on schedule with nothing else standing against it. */
const RENEWING_PRODUCT = "prod-active-13";
const SUSPENDED_PRODUCT = "prod-mail";
const TRIAL_PRODUCT = "prod-seats";
const ONE_TIME_PRODUCT = "prod-domains";
const UNTAGGED_PRODUCT = "prod-archive";

/** The banner each status alone decides — the product's own row supplies the destination. */
const ACTION_BY_STATUS: Partial<
  Record<ContractStatusCodes, (product: MockProduct) => string>
> = {
  [ContractStatusCodes.PENDING]: product =>
    mockActionValue(MOCK_ACTION.NAVIGATE, `/billing/orders/${product.orderId}`),
  [ContractStatusCodes.AWAITING_ACTIVATION]: product =>
    mockActionValue(MOCK_ACTION.NAVIGATE, `/products/${product.id}/setup`),
  [ContractStatusCodes.SUSPENDED]: () =>
    mockActionValue(MOCK_ACTION.NAVIGATE, "/billing/invoices?status=unpaid")
};

function contextFor(productId: string): DataRouteContext {
  return { groupSlug: GROUP_SLUG, productId };
}

function seeded(data: MockDataset, productId: string): MockProduct {
  const product = find(data.products, { id: productId });
  if (product === undefined) throw new Error(`seed carries no ${productId}`);
  return product;
}

function withFeatures(overrides: Partial<MockBrandFeatures>): MockDataset {
  const dataset: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
  return assign(dataset, {
    features: assign({}, dataset.features, overrides)
  });
}

function withDelegated(productId: string): MockDataset {
  const dataset: MockDataset = structuredClone(HOSTGRID_MOCK_DATASET);
  const product = seeded(dataset, productId);
  assign(product, { isDelegated: true });
  return dataset;
}

function billboardRow(data: MockDataset, productId: string) {
  const row = find(productBillboardItems(data, contextFor(productId)), {
    id: productId
  });
  if (row === undefined) throw new Error(`no billboard row for ${productId}`);
  return row;
}

function specText(items: readonly SpecModuleItem[]): string {
  return map(items, item => `${item.label} ${item.value}`).join(" | ");
}

function navLabels(data: MockDataset, productId: string): string[] {
  return map(productAreaNavItems(data, contextFor(productId)), item =>
    item.label.toLowerCase()
  );
}

describe("billboard — the product leads with its own name, category and standing", () => {
  it("carries the seeded category and tags rather than a composed line", () => {
    const product = seeded(HOSTGRID_MOCK_DATASET, ACTIVE_PRODUCT);
    const row = billboardRow(HOSTGRID_MOCK_DATASET, ACTIVE_PRODUCT);

    expect(product.tags?.length).toBeGreaterThan(0);
    expect(row.category).toBe(product.category);
    expect(map(row.tags, "label")).toEqual(product.tags);
    expect(row.status?.label).toBeTruthy();
    expect(row.status?.tone).toBeTruthy();
  });

  it("leads with the client's own label for the product, and with its name where there is none", () => {
    const labelled = seeded(HOSTGRID_MOCK_DATASET, ACTIVE_PRODUCT);
    const unlabelled = seeded(HOSTGRID_MOCK_DATASET, "prod-team");

    expect(labelled.customLabel).toBeTruthy();
    expect(labelled.customLabel).not.toBe(labelled.name);
    expect(billboardRow(HOSTGRID_MOCK_DATASET, ACTIVE_PRODUCT).title).toBe(
      labelled.customLabel
    );
    expect(unlabelled.customLabel).toBeUndefined();
    expect(billboardRow(HOSTGRID_MOCK_DATASET, "prod-team").title).toBe(
      unlabelled.name
    );
  });

  it("reads the status badge off ContractStatusCodes — one label per state, not one for all", () => {
    const badges = new Map(
      map(
        [ACTIVE_PRODUCT, SUSPENDED_PRODUCT, "prod-team", "prod-starter"],
        id => [id, billboardRow(HOSTGRID_MOCK_DATASET, id).status]
      )
    );
    const labels = map(Array.from(badges.values()), badge => badge?.label);

    expect(new Set(labels).size).toBe(labels.length);
    expect(badges.get(ACTIVE_PRODUCT)?.label).toBe("Active");
    expect(badges.get("prod-starter")?.label).toBe("Cancelled");
    expect(badges.get(SUSPENDED_PRODUCT)?.tone).not.toBe(
      badges.get(ACTIVE_PRODUCT)?.tone
    );
  });

  it("tells the same status story the listing row tells", () => {
    const listing = groupProductItems(HOSTGRID_MOCK_DATASET, {
      groupSlug: GROUP_SLUG,
      status: "all"
    });

    for (const id of [ACTIVE_PRODUCT, SUSPENDED_PRODUCT, "prod-starter"]) {
      expect({
        id,
        status: billboardRow(HOSTGRID_MOCK_DATASET, id).status
      }).toEqual({ id, status: find(listing, { id })?.status });
    }
  });

  it("a product with no tags of its own shows none", () => {
    expect(seeded(HOSTGRID_MOCK_DATASET, UNTAGGED_PRODUCT).tags).toBeFalsy();
    expect(
      billboardRow(HOSTGRID_MOCK_DATASET, UNTAGGED_PRODUCT).tags ?? []
    ).toEqual([]);
  });
});

describe("condition banner — every seeded product gets the banner its own state calls for", () => {
  const data = HOSTGRID_MOCK_DATASET;

  function actionFor(product: MockProduct) {
    return productConditionAction(data, contextFor(product.id));
  }

  it("a status that speaks for itself names the destination it needs", () => {
    const graded = filter(data.products, product =>
      includes(Object.keys(ACTION_BY_STATUS), product.status)
    );

    expect(map(graded, "status")).toEqual(
      expect.arrayContaining(Object.keys(ACTION_BY_STATUS))
    );
    for (const product of graded) {
      const expected = ACTION_BY_STATUS[product.status]?.(product);
      expect({ id: product.id, value: actionFor(product)?.value }).toEqual({
        id: product.id,
        value: expected
      });
      expect(productHasCondition(data, contextFor(product.id))).toBe(true);
      expect(
        productConditionMessage(data, contextFor(product.id))
      ).toBeTruthy();
    }
  });

  it("an unactivated product is asked to finish setting itself up", () => {
    const product = find(data.products, {
      status: ContractStatusCodes.AWAITING_ACTIVATION
    });

    expect(actionFor(product ?? data.products[0])?.label).toMatch(
      /complete setup/i
    );
  });

  it("offers every CTA the legacy banner had — go to order, don't cancel, complete setup, view invoices", () => {
    const offered = map(data.products, product => actionFor(product)?.label);

    for (const cta of [
      /go to order/i,
      /don.?t cancel/i,
      /complete setup/i,
      /view invoices/i
    ]) {
      expect(offered).toEqual(
        expect.arrayContaining([expect.stringMatching(cta)])
      );
    }
  });

  it("a product that has stopped renewing is offered its renewal back", () => {
    const expiring = filter(data.products, product =>
      Boolean(
        actionFor(product)?.value.startsWith(MOCK_ACTION.DISABLE_AUTO_EXPIRE)
      )
    );

    expect(expiring).toHaveLength(1);
    for (const product of expiring) {
      expect(actionFor(product)?.value).toBe(
        mockActionValue(MOCK_ACTION.DISABLE_AUTO_EXPIRE, product.id)
      );
      expect(product.autoRenew).toBe(false);
      expect(
        productConditionMessage(data, contextFor(product.id))
      ).toBeTruthy();
    }
  });

  // Superseded 2026-09-06 (plan F18 O-2): legacy's condition table has a
  // reading for every state, so a running product says it is running and
  // offers the billing it renews on — the silent product is gone.
  it("a product that is simply running says so, and offers its billing", () => {
    const running = seeded(data, RENEWING_PRODUCT);

    expect(productHasCondition(data, contextFor(RENEWING_PRODUCT))).toBe(true);
    expect(
      productConditionMessage(data, contextFor(RENEWING_PRODUCT))
    ).toContain(running.nextDueDate);
    expect(productConditionTone(data, contextFor(RENEWING_PRODUCT))).toBe(
      "success"
    );
    expect(actionFor(running)?.value).toBe(
      mockActionValue(
        MOCK_ACTION.NAVIGATE,
        `/${running.groupSlug}/${running.id}/billing`
      )
    );
  });

  // Superseded with it: a banner always says something, but a state with
  // nowhere to send the client (a cancelled contract, a fulfilled purchase)
  // carries no control.
  it("every banner says something, and the ones with somewhere to go carry a control", () => {
    const speaking = filter(data.products, product =>
      productHasCondition(data, contextFor(product.id))
    );
    const leading = filter(
      speaking,
      product => actionFor(product) !== undefined
    );

    expect(speaking).toHaveLength(data.products.length);
    expect(leading.length).toBeGreaterThan(0);
    expect(leading.length).toBeLessThan(speaking.length);
    for (const product of speaking) {
      const context = contextFor(product.id);
      expect({
        id: product.id,
        title: Boolean(productConditionTitle(data, context)),
        message: Boolean(productConditionMessage(data, context)),
        tone: Boolean(productConditionTone(data, context))
      }).toEqual({ id: product.id, title: true, message: true, tone: true });
    }
    for (const product of leading) {
      expect(actionFor(product)?.label).toMatch(/\S/);
      expect(actionFor(product)?.value).toMatch(/\S/);
    }
  });
});

describe("summary — the sidebar's own facts, each only where the product has it", () => {
  const data = HOSTGRID_MOCK_DATASET;

  it("names the renewal term, the price with its term, and the tax it is quoted at", () => {
    const product = seeded(data, ACTIVE_PRODUCT);
    const items = productSpecItems(data, contextFor(ACTIVE_PRODUCT));
    const priceRow = find(items, item =>
      includes(item.value, product.price?.formatted)
    );

    expect(specText(items)).toContain(product.renewalTerm);
    expect(`${priceRow?.label} ${priceRow?.value}`).toContain(
      product.billingTerm
    );
    expect(specText(items)).toContain(product.taxLabel);
  });

  it("links the purchase date to the order it was bought on", () => {
    const product = seeded(data, ACTIVE_PRODUCT);
    const items = productSpecItems(data, contextFor(ACTIVE_PRODUCT));
    const purchaseRow = find(items, {
      to: `/billing/orders/${product.orderId}`
    });

    expect(purchaseRow?.value).toContain(product.purchasedAt);
  });

  it("shows when a free trial ends, and only for a product on one", () => {
    const onTrial = seeded(data, TRIAL_PRODUCT);
    const trialRow = find(
      productSpecItems(data, contextFor(TRIAL_PRODUCT)),
      item => /trial/i.test(item.label)
    );

    expect(onTrial.trialEndsAt).toBeTruthy();
    expect(trialRow?.value).toContain(onTrial.trialEndsAt);
    expect(seeded(data, ACTIVE_PRODUCT).trialEndsAt).toBeUndefined();
    expect(
      some(productSpecItems(data, contextFor(ACTIVE_PRODUCT)), item =>
        /trial/i.test(item.label)
      )
    ).toBe(false);
  });

  it("a one-time purchase claims neither a renewal term nor a tax note", () => {
    const product = seeded(data, ONE_TIME_PRODUCT);
    const text = specText(productSpecItems(data, contextFor(ONE_TIME_PRODUCT)));

    expect(product.renewalTerm).toBeUndefined();
    expect(product.taxLabel).toBeUndefined();
    expect(some(values(MOCK_RENEWAL_TERM), term => includes(text, term))).toBe(
      false
    );
    expect(text).not.toMatch(/vat|inc\./i);
  });
});

describe("about — the brand's own words, or no panel", () => {
  it("renders the product's description verbatim", () => {
    const product = seeded(HOSTGRID_MOCK_DATASET, ACTIVE_PRODUCT);

    expect(product.description).toBeTruthy();
    expect(
      productAboutMarkdown(HOSTGRID_MOCK_DATASET, contextFor(ACTIVE_PRODUCT))
    ).toBe(product.description);
    expect(
      productHasAbout(HOSTGRID_MOCK_DATASET, contextFor(ACTIVE_PRODUCT))
    ).toBe(true);
  });

  it("hides itself where the brand wrote nothing", () => {
    expect(
      seeded(HOSTGRID_MOCK_DATASET, UNTAGGED_PRODUCT).description
    ).toBeUndefined();
    expect(
      productHasAbout(HOSTGRID_MOCK_DATASET, contextFor(UNTAGGED_PRODUCT))
    ).toBe(false);
    expect(
      productAboutMarkdown(HOSTGRID_MOCK_DATASET, contextFor(UNTAGGED_PRODUCT))
    ).toHaveLength(0);
  });
});

describe("assistance — the support CTA arrives with the product already chosen", () => {
  it("opens a new ticket for THIS product", () => {
    expect(
      productSupportAction(HOSTGRID_MOCK_DATASET, contextFor(ACTIVE_PRODUCT))
    ).toBe(
      mockActionValue(
        MOCK_ACTION.NAVIGATE,
        `/support/tickets/new?product=${ACTIVE_PRODUCT}`
      )
    );
  });

  it("is absent for a brand that runs no support system", () => {
    const disabled = withFeatures({ DISABLE_SUPPORT_SYSTEM: true });

    expect(isSupportEnabled(disabled)).toBe(false);
    expect(
      productSupportAction(disabled, contextFor(ACTIVE_PRODUCT))
    ).toBeUndefined();
  });

  it("is absent on the shipped dataset whose support gate is off", () => {
    const data = HOSTGRID_MINIMAL_MOCK_DATASET;

    expect(data.features.DISABLE_SUPPORT_SYSTEM).toBe(true);
    expect(
      productSupportAction(data, contextFor(ACTIVE_PRODUCT))
    ).toBeUndefined();
  });
});

describe("area nav — the tabs a product actually has", () => {
  it("offers Settings to a subscription the client owns outright", () => {
    expect(seeded(HOSTGRID_MOCK_DATASET, ACTIVE_PRODUCT).billingType).toBe(
      "subscription"
    );
    expect(navLabels(HOSTGRID_MOCK_DATASET, ACTIVE_PRODUCT)).toContain(
      "settings"
    );
  });

  it("withholds Settings from a one-time purchase", () => {
    expect(seeded(HOSTGRID_MOCK_DATASET, ONE_TIME_PRODUCT).billingType).toBe(
      "one-time"
    );
    expect(navLabels(HOSTGRID_MOCK_DATASET, ONE_TIME_PRODUCT)).not.toContain(
      "settings"
    );
  });

  it("withholds Settings from a product managed on someone else's behalf", () => {
    const delegated = withDelegated(ACTIVE_PRODUCT);

    expect(seeded(delegated, ACTIVE_PRODUCT).isDelegated).toBe(true);
    expect(navLabels(delegated, ACTIVE_PRODUCT)).not.toContain("settings");
  });

  it("drops Tickets for a brand with support switched off", () => {
    const disabled = withFeatures({ DISABLE_SUPPORT_SYSTEM: true });

    expect(navLabels(HOSTGRID_MOCK_DATASET, ACTIVE_PRODUCT)).toContain(
      "tickets"
    );
    expect(navLabels(disabled, ACTIVE_PRODUCT)).not.toContain("tickets");
    expect(
      navLabels(HOSTGRID_MINIMAL_MOCK_DATASET, ACTIVE_PRODUCT)
    ).not.toContain("tickets");
  });
});
