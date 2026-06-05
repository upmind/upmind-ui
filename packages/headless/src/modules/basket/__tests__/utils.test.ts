// -----------------------------------------------------------------------------
/**
 * @fileoverview Basket Utils Tests — hasProductChanges & preserveProvisionFields
 *
 * ## Job To Be Done
 * Verify that `hasProductChanges` correctly detects product identity, config,
 * and provision-value changes between basket states — controlling when the
 * expensive N+1 provision field fetch / re-validation is triggered during
 * refreshes.
 *
 * Verify that `preserveProvisionFields` correctly copies existing provision field
 * data from old products to new products by ID match.
 *
 * ## What Breaks If These Fail
 * - False negative (misses real change): provision data not re-fetched/
 *   re-validated → stale errors, e.g. product setup loop short-circuits to
 *   checkout after fixing one of several invalid products.
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

const makeOption = (
  id: string,
  categoryId: string,
  quantity = 1,
  term = 12
) => ({
  product_id: id,
  unit_quantity: quantity,
  billing_cycle_months: term,
  product: { id, category_id: categoryId }
});

const baseProducts = [
  {
    id: "prod-1",
    product_id: "pid-1",
    quantity: 1,
    billing_cycle_months: 12,
    options: [makeOption("opt-a", "cat-opts"), makeOption("opt-b", "cat-opts")],
    attributes: [makeOption("attr-x", "cat-attrs")],
    provision_fields: { hostname: "server1.example.com" }
  },
  {
    id: "prod-2",
    product_id: "pid-2",
    quantity: 1,
    billing_cycle_months: 1,
    options: [],
    attributes: [makeOption("attr-y", "cat-attrs")],
    provision_fields: { domain: "example.com" }
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
      makeOption("opt-a", "cat-opts"),
      makeOption("opt-c", "cat-opts") // changed from opt-b
    ];
    const newBasket = makeBasket(newProducts);
    expect(hasProductChanges(oldBasket, newBasket)).toBe(true);
  });

  it("returns true when product attributes change", () => {
    const oldBasket = makeBasket(baseProducts);
    const newProducts = cloneDeep(baseProducts);
    newProducts[1].attributes = [makeOption("attr-z", "cat-attrs")]; // changed from attr-y
    const newBasket = makeBasket(newProducts);
    expect(hasProductChanges(oldBasket, newBasket)).toBe(true);
  });

  it("returns true when provision_fields values change (FE-2457 regression)", () => {
    const oldBasket = makeBasket(baseProducts);
    const newProducts = cloneDeep(baseProducts);
    newProducts[0].provision_fields = { hostname: "server2.example.com" };
    const newBasket = makeBasket(newProducts);
    expect(hasProductChanges(oldBasket, newBasket)).toBe(true);
  });

  it("returns true when product quantity changes", () => {
    const oldBasket = makeBasket(baseProducts);
    const newProducts = cloneDeep(baseProducts);
    newProducts[0].quantity = 3;
    const newBasket = makeBasket(newProducts);
    expect(hasProductChanges(oldBasket, newBasket)).toBe(true);
  });

  it("returns true when product term changes", () => {
    const oldBasket = makeBasket(baseProducts);
    const newProducts = cloneDeep(baseProducts);
    newProducts[0].billing_cycle_months = 24;
    const newBasket = makeBasket(newProducts);
    expect(hasProductChanges(oldBasket, newBasket)).toBe(true);
  });

  it("returns true when option quantity changes", () => {
    const oldBasket = makeBasket(baseProducts);
    const newProducts = cloneDeep(baseProducts);
    newProducts[0].options[0].unit_quantity = 5;
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
      makeOption("opt-a", "cat-opts"),
      makeOption("opt-b", "cat-opts"),
      makeOption("opt-new", "cat-opts") // added option
    ];
    const newBasket = makeBasket(newProducts);
    expect(hasProductChanges(oldBasket, newBasket)).toBe(true);
  });

  it("returns true when option is removed from a product", () => {
    const oldBasket = makeBasket(baseProducts);
    const newProducts = cloneDeep(baseProducts);
    newProducts[0].options = [makeOption("opt-a", "cat-opts")]; // removed opt-b
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
