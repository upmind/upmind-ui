/**
 * @module form/renderers/__tests__/invoices-contract-product-id-wire
 * @description Pins FE-3031's mid-run AC B: the invoices module's declared
 * `products.contracts_product_id` filter column reaches the wire under the
 * EXACT key the API accepts — `filter[products.contracts_product_id|eq]` —
 * confirmed against the oracle's own filter usage
 * (`creditNotesTable.vue:223-226`, already cited in
 * `docs/sdd/FE-3031/design.md:475`), post-`translateQuery`, never on the
 * model alone — the standard this module's own `invoices-filter-wire.test.ts`
 * already holds every other filter column to, and the exact lesson this
 * story's `setCriteria` silent-strip defect (`review-notes.md`) established:
 * a nested/dotted key can look correct on the model and still be stripped by
 * `additionalProperties: false` with no ajv error, so the assertion must be
 * post-`translateQuery`, never pre-.
 *
 * This column is declared in the schema but NOT drawn as a control in the
 * client filter bar (`design.md`'s filter-columns table: "no — set when
 * scoping to a product", the same disposition as `id` / `contracts.id` /
 * `credit_invoice_id`), so it is set directly on the model — mirroring how
 * every other undrawn-but-declared column in this module is exercised —
 * rather than through a rendered control that does not exist.
 *
 * Negative control: `invoices-contract-product-id-wire.must-fail.patch`.
 */

import { describe, expect, it } from "vitest";
import { translateQuery } from "@upmind-automation/headless";
import { invoicesQuery } from "./filter.harness";
import { get } from "lodash-es";

const declaration = invoicesQuery();

const COLUMN = "products.contracts_product_id";
const WIRE_KEY = "filter[products.contracts_product_id|eq]";

describe("the invoices module's published schema declares products.contracts_product_id", () => {
  it("the column is declared under filters, so additionalProperties:false cannot silently strip it", () => {
    const property = get(declaration.schema, [
      "properties",
      "filters",
      "properties",
      COLUMN
    ]);
    expect(property).toBeDefined();
  });
});

describe("scoping by product reaches the wire under the API's own key (AC B)", () => {
  it("setting products.contracts_product_id|eq on the model reaches the wire as filter[products.contracts_product_id|eq], post-translateQuery", () => {
    const model = { filters: { [COLUMN]: { eq: "product-scope-001" } } };

    const wire = get(translateQuery(declaration.schema, model), "filters") as
      | Record<string, string>
      | undefined;

    expect(wire?.[WIRE_KEY]).toBe("product-scope-001");
  });

  it("FAIRNESS CONTROL — an unset products.contracts_product_id reaches the wire as the declared key, present and empty, never absent", () => {
    const model = { filters: {} };

    const wire = get(translateQuery(declaration.schema, model), "filters") as
      | Record<string, string>
      | undefined;

    expect(wire).toBeDefined();
    expect(Object.prototype.hasOwnProperty.call(wire, WIRE_KEY)).toBe(true);
    expect(wire?.[WIRE_KEY]).toBe("");
  });
});
