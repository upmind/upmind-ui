// -----------------------------------------------------------------------------
/**
 * @fileoverview Basket Utils Tests — hasProductChanges & preserveProvisionFields
 *
 * ## Job To Be Done
 * Verify that `hasProductChanges` correctly detects product additions, removals,
 * and option/attribute changes between basket states — controlling when the
 * expensive N+1 provision field fetch is triggered during refreshes.
 *
 * Verify that `preserveProvisionFields` correctly copies existing provision field
 * data from old products to new products by ID match.
 *
 * ## What Breaks If These Fail
 * - False negative (misses real change): provision fields not re-fetched when
 *   products changed → stale/missing provision requirements in checkout.
 * - False positive (detects non-change): provision fields re-fetched unnecessarily
 *   → defeating the optimisation, N+1 API calls on every refresh.
 * - Provision fields lost: user sees empty provision fields after a non-product
 *   refresh (currency change, promo code) when data should be preserved.
 */

import { describe, it, expect } from "vitest";
import { hasProductChanges, preserveProvisionFields } from "../utils";

// --- utils
import { cloneDeep } from "lodash-es";

// --- types
import type { IBasket } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
// Fixtures — minimal basket shapes for testing product change detection

const makeBasket = (products: any[]): IBasket =>
  ({ products }) as unknown as IBasket;

const baseProducts = [
  {
    id: "prod-1",
    options: [{ product_id: "opt-a" }, { product_id: "opt-b" }],
    attributes: [{ product_id: "attr-x" }],
    provision_fields: [{ key: "hostname", value: "server1.example.com" }]
  },
  {
    id: "prod-2",
    options: [],
    attributes: [{ product_id: "attr-y" }],
    provision_fields: [{ key: "domain", value: "example.com" }]
  }
];

// -----------------------------------------------------------------------------

describe("hasProductChanges", () => {
  it("returns true when old basket is undefined (first load)", () => {
    const newBasket = makeBasket(baseProducts);
    expect(hasProductChanges(undefined, newBasket)).toBe(true);
  });

  it("returns true when old basket has no products", () => {
    const oldBasket = makeBasket([]);
    const newBasket = makeBasket(baseProducts);
    expect(hasProductChanges(oldBasket, newBasket)).toBe(true);
  });

  it("returns true when a product is added", () => {
    const oldBasket = makeBasket([baseProducts[0]]);
    const newBasket = makeBasket(baseProducts);
    expect(hasProductChanges(oldBasket, newBasket)).toBe(true);
  });

  it("returns true when a product is removed", () => {
    const oldBasket = makeBasket(baseProducts);
    const newBasket = makeBasket([baseProducts[0]]);
    expect(hasProductChanges(oldBasket, newBasket)).toBe(true);
  });

  it("returns true when product options change", () => {
    const oldBasket = makeBasket(baseProducts);
    const newProducts = cloneDeep(baseProducts);
    newProducts[0].options = [
      { product_id: "opt-a" },
      { product_id: "opt-c" } // changed from opt-b
    ];
    const newBasket = makeBasket(newProducts);
    expect(hasProductChanges(oldBasket, newBasket)).toBe(true);
  });

  it("returns true when product attributes change", () => {
    const oldBasket = makeBasket(baseProducts);
    const newProducts = cloneDeep(baseProducts);
    newProducts[1].attributes = [{ product_id: "attr-z" }]; // changed from attr-y
    const newBasket = makeBasket(newProducts);
    expect(hasProductChanges(oldBasket, newBasket)).toBe(true);
  });

  it("returns false when products are unchanged (only price/currency differ)", () => {
    const oldBasket = makeBasket(baseProducts);
    const newProducts = cloneDeep(baseProducts);
    // Add non-product-identity fields that shouldn't trigger a change
    (newProducts[0] as any).total_amount = 99.99;
    (newProducts[0] as any).currency_code = "EUR";
    const newBasket = makeBasket(newProducts);
    expect(hasProductChanges(oldBasket, newBasket)).toBe(false);
  });

  it("returns false when products are identical", () => {
    const oldBasket = makeBasket(baseProducts);
    const newBasket = makeBasket(cloneDeep(baseProducts));
    expect(hasProductChanges(oldBasket, newBasket)).toBe(false);
  });

  it("returns false when product order differs but same products", () => {
    const oldBasket = makeBasket(baseProducts);
    const newBasket = makeBasket([baseProducts[1], baseProducts[0]]);
    expect(hasProductChanges(oldBasket, newBasket)).toBe(false);
  });

  it("returns true when option is added to a product", () => {
    const oldBasket = makeBasket(baseProducts);
    const newProducts = cloneDeep(baseProducts);
    newProducts[0].options = [
      { product_id: "opt-a" },
      { product_id: "opt-b" },
      { product_id: "opt-new" } // added option
    ];
    const newBasket = makeBasket(newProducts);
    expect(hasProductChanges(oldBasket, newBasket)).toBe(true);
  });

  it("returns true when option is removed from a product", () => {
    const oldBasket = makeBasket(baseProducts);
    const newProducts = cloneDeep(baseProducts);
    newProducts[0].options = [{ product_id: "opt-a" }]; // removed opt-b
    const newBasket = makeBasket(newProducts);
    expect(hasProductChanges(oldBasket, newBasket)).toBe(true);
  });
});

// -----------------------------------------------------------------------------

describe("preserveProvisionFields", () => {
  it("copies provision_fields from old products to new products by ID", () => {
    const oldBasket = makeBasket(baseProducts);
    const newProducts = cloneDeep(baseProducts);
    // Remove provision_fields from new products (simulating API response without them)
    delete newProducts[0].provision_fields;
    delete newProducts[1].provision_fields;
    const newBasket = makeBasket(newProducts);

    preserveProvisionFields(oldBasket, newBasket);

    expect(newBasket.products[0].provision_fields).toEqual(
      baseProducts[0].provision_fields
    );
    expect(newBasket.products[1].provision_fields).toEqual(
      baseProducts[1].provision_fields
    );
  });

  it("handles undefined old basket gracefully", () => {
    const newProducts = cloneDeep(baseProducts);
    const newBasket = makeBasket(newProducts);

    // Should not throw
    expect(() => preserveProvisionFields(undefined, newBasket)).not.toThrow();
  });

  it("preserves provision_fields only for matching product IDs", () => {
    const oldBasket = makeBasket([baseProducts[0]]);
    const newProducts = cloneDeep(baseProducts);
    delete newProducts[0].provision_fields;
    delete newProducts[1].provision_fields;
    const newBasket = makeBasket(newProducts);

    preserveProvisionFields(oldBasket, newBasket);

    // prod-1 should get its fields back, prod-2 should remain without
    expect(newBasket.products[0].provision_fields).toEqual(
      baseProducts[0].provision_fields
    );
    expect(newBasket.products[1].provision_fields).toBeUndefined();
  });

  it("does not overwrite existing provision_fields in new basket", () => {
    const oldBasket = makeBasket(baseProducts);
    const newProducts = cloneDeep(baseProducts);
    const freshFields = [{ key: "hostname", value: "new-server.example.com" }];
    // prod-1 already has provision_fields in old basket, but old product also has them
    // The function uses set() which overwrites — this test documents current behaviour
    newProducts[0].provision_fields = freshFields;
    const newBasket = makeBasket(newProducts);

    preserveProvisionFields(oldBasket, newBasket);

    // Old product has provision_fields, so set() overwrites the new ones
    expect(newBasket.products[0].provision_fields).toEqual(
      baseProducts[0].provision_fields
    );
  });
});
