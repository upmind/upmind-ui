// -----------------------------------------------------------------------------
/**
 * @fileoverview the criteria ⇄ url round-trip CONVERGES for every declared column
 *
 * ## Job To Be Done
 * `useCriteriaUrlSync` writes the url from the criteria model and seeds the
 * criteria model from the url. If a column can be written to the url but not
 * read back — or read back as a DIFFERENT model — the two directions disagree
 * forever and the page re-writes, re-seeds and re-fetches without settling.
 *
 * That is not theoretical: enumerating pairs off `columnSchema.properties`
 * alone skipped every column declaring no operator (the bare `filter[column]`
 * spelling the API requires), so 15 of the invoices module's 17 columns became
 * invisible to both directions at once.
 *
 * The real schema is the invoices module's own, read through its published
 * surface — never a hand-built one, which could not have caught this.
 *
 * ## What Breaks If These Fail
 * A page whose url carries a filter re-reads it endlessly: tens of thousands
 * of requests, a wedged tab, and a notice reporting a count that never settles.
 */

import { describe, expect, it } from "vitest";
import { useInvoices } from "@upmind-automation/headless";
import { InvoiceCategoryCode, InvoiceStatus } from "@upmind-automation/types";
import {
  criteriaToParams,
  declaredPairs,
  paramsToCriteria
} from "../runtime/composables/useCriteriaUrlSync.utils";
import { filter, map, size } from "lodash-es";

// -----------------------------------------------------------------------------

const schema = () => useInvoices().as("self").useContext().schemas.query.schema;

describe("criteria ⇄ url — every declared column survives the round-trip", () => {
  it("enumerates EVERY declared column, operator-bearing or not", () => {
    const pairs = declaredPairs(schema());
    const columns = new Set(map(pairs, ([column]) => column));

    // The two date ranges carry operators; every other column is bare.
    expect(size(filter(pairs, ([, operator]) => !operator))).toBeGreaterThan(0);
    expect(columns.has("status.code")).toBe(true);
    expect(columns.has("client_id")).toBe(true);
    expect(columns.has("create_datetime")).toBe(true);
  });

  it("a bare column round-trips to the SAME model — the loop condition", () => {
    const model = {
      filters: { client_id: "04038696-e547-21d4-93ef-e18d9305e7d2" }
    };
    const params = criteriaToParams(schema(), model);

    expect(params["filter.client_id"]).toBe(
      "04038696-e547-21d4-93ef-e18d9305e7d2"
    );
    expect(paramsToCriteria(schema(), params)).toMatchObject(model);
  });

  it("a multi-value column rides ONE param and round-trips to the same array", () => {
    const model = {
      filters: {
        "status.code": [InvoiceStatus.UNPAID, InvoiceStatus.OVERDUE],
        "category.slug": [InvoiceCategoryCode.RECURRENT]
      }
    };
    const params = criteriaToParams(schema(), model);

    expect(params["filter.status.code"]).toBe(
      `${InvoiceStatus.UNPAID},${InvoiceStatus.OVERDUE}`
    );
    expect(paramsToCriteria(schema(), params)).toMatchObject(model);
  });

  it("an operator-bearing column still round-trips — this is an addition", () => {
    const model = {
      filters: { create_datetime: { gte: "2026-01-01T00:00:00Z" } }
    };
    const params = criteriaToParams(schema(), model);

    expect(params["filter.create_datetime.gte"]).toBe("2026-01-01T00:00:00Z");
    expect(paramsToCriteria(schema(), params)).toMatchObject(model);
  });

  it("a boolean column round-trips as a boolean, never the string 'false'", () => {
    const model = { filters: { is_consolidation: false } };
    const params = criteriaToParams(schema(), model);

    expect(params["filter.is_consolidation"]).toBe("false");
    expect(paramsToCriteria(schema(), params)).toMatchObject(model);
  });
});

// FE-3237 AC22
describe("criteria ⇄ url — the order history's own leaves survive the round-trip", () => {
  const orderSchema = () =>
    useInvoices()
      .as("client")
      .for(InvoiceCategoryCode.NEW_CONTRACT as never)
      .useContext().schemas.query.schema;

  it("declares the order columns and no category column a url could override", () => {
    const columns = new Set(map(declaredPairs(orderSchema()), ([c]) => c));

    expect(columns.has("number")).toBe(true);
    expect(columns.has("total_amount")).toBe(true);
    expect(columns.has("paid_datetime")).toBe(true);
    expect(columns.has("products.service_identifier")).toBe(true);
    expect(columns.has("category.slug")).toBe(false);
    expect(columns.has("client_id")).toBe(false);
  });

  it.each([
    ["the number search", { number: { eq: "QA-INV-26050" } }],
    ["a total comparison", { total_amount: { gte: 12 } }],
    [
      "the Unpaid status choice",
      { "status.code": { eq: ["invoice_unpaid,invoice_adjusted"] } }
    ],
    ["a relative placed period", { create_datetime: { after: "-7_days" } }],
    [
      "an absolute paid date",
      { paid_datetime: { gte: "2026-10-01 00:00:00" } }
    ],
    ["an item name", { "products.product.name": { like: "Hosting" } }]
  ])("%s round-trips to the same order model", (_, filters) => {
    const model = { filters };
    const params = criteriaToParams(orderSchema(), model);

    expect(size(params)).toBeGreaterThan(0);
    expect(paramsToCriteria(orderSchema(), params)).toMatchObject(model);
  });
});
