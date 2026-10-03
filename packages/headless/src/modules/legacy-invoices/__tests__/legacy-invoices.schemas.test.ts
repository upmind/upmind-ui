// -----------------------------------------------------------------------------
/**
 * @fileoverview legacy-invoices criteria schema — the declared operator
 * branches, the sort vocabulary, and the page-window defaults (unit, AC-2,
 * AC-3, AC-9, AC-10, AC-11; design.md §8.3, ADR-032 decisions 1/10/13)
 *
 * ## Job To Be Done
 * The schema is the gate (ADR-032): an undeclared filter column or operator
 * must be UNSPELLABLE, not merely rejected downstream, and the page-window
 * defaults this module declares itself (D-24) are what criterion AC-9's
 * fallback anchors on. This file compiles the REAL schema with the repo's
 * own ajv instance and drives real data through it — never asserts on the
 * schema's own literal text.
 *
 * ## What Breaks If These Fail
 * A disallowed operator reaching validation green would let a stale or
 * hand-edited filter key reach the wire and 422/500 the whole list read
 * (ADR-032's server contract). A drifted page-window default would silently
 * move criterion AC-9's fallback anchor into the query core.
 */

import { createAjv } from "@jsonforms/core";
import { describe, expect, it } from "vitest";
import {
  useQuerySchema,
  useQueryUischema,
  useSortUischema
} from "../legacy-invoices.schemas";
import type { JsonSchema7 } from "@jsonforms/core";

// -----------------------------------------------------------------------------

const ajv = createAjv({ useDefaults: true });

function validates(schema: JsonSchema7, data: unknown): boolean {
  const validate = ajv.compile(schema as object);
  return validate(data as never);
}

describe("legacy-invoices criteria schema — declared filter columns (AC-2)", () => {
  it("@AC-2 rejects an undeclared filter column — additionalProperties:false", () => {
    expect(
      validates(useQuerySchema(), {
        filters: { totally_undeclared_column: { eq: "x" } }
      })
    ).toBe(false);
  });

  it("@AC-2 the number column accepts eq, neq and like, and no other operator", () => {
    const schema = useQuerySchema();
    expect(validates(schema, { filters: { number: { eq: "C-INV-1" } } })).toBe(
      true
    );
    expect(validates(schema, { filters: { number: { neq: "C-INV-1" } } })).toBe(
      true
    );
    expect(validates(schema, { filters: { number: { like: "INV" } } })).toBe(
      true
    );
    expect(validates(schema, { filters: { number: { gt: "C-INV-1" } } })).toBe(
      false
    );
  });

  it("@AC-11 @AC-14 the number column declares no starts_with or ends_with operator — like is CONTAINS only (ruling OD5)", () => {
    const schema = useQuerySchema();
    expect(
      validates(schema, { filters: { number: { starts_with: "INV" } } })
    ).toBe(false);
    expect(
      validates(schema, { filters: { number: { ends_with: "INV" } } })
    ).toBe(false);
  });

  it("@AC-2 the total_amount column accepts eq/neq/gt/gte/lt/lte, and no other operator", () => {
    const schema = useQuerySchema();
    for (const operator of ["eq", "neq", "gt", "gte", "lt", "lte"] as const) {
      expect(
        validates(schema, { filters: { total_amount: { [operator]: 10 } } }),
        `total_amount.${operator}`
      ).toBe(true);
    }
    expect(
      validates(schema, { filters: { total_amount: { like: "10" } } })
    ).toBe(false);
  });

  it("@AC-2 @AC-10 @AC-15 the create_datetime column takes a bare date on eq/gt/lt, a datetime on gte/lte, a relative expression on before/after, and no other operator", () => {
    const schema = useQuerySchema();
    const bareDate = "2026-01-15";
    const datetime = "2026-01-01 00:00:00";

    for (const operator of ["eq", "gt", "lt"] as const) {
      expect(
        validates(schema, {
          filters: { create_datetime: { [operator]: bareDate } }
        }),
        `create_datetime.${operator} accepts a bare date`
      ).toBe(true);
      expect(
        validates(schema, {
          filters: { create_datetime: { [operator]: datetime } }
        }),
        `create_datetime.${operator} rejects a datetime`
      ).toBe(false);
    }
    for (const operator of ["gte", "lte"] as const) {
      expect(
        validates(schema, {
          filters: { create_datetime: { [operator]: datetime } }
        }),
        `create_datetime.${operator} accepts a datetime`
      ).toBe(true);
    }
    for (const operator of ["before", "after"] as const) {
      expect(
        validates(schema, {
          filters: { create_datetime: { [operator]: "-1_months" } }
        }),
        `create_datetime.${operator} accepts a relative expression`
      ).toBe(true);
    }
    expect(
      validates(schema, { filters: { create_datetime: { neq: bareDate } } })
    ).toBe(false);
  });

  it("@AC-10 @AC-15 the create_datetime operators split by format: eq/gt/lt declare date, gte/lte date-time, before/after none", () => {
    const dateColumn = (useQuerySchema().properties?.filters as JsonSchema7)
      .properties?.create_datetime as JsonSchema7;
    const formatOf = (operator: string) =>
      (dateColumn.properties?.[operator] as JsonSchema7 | undefined)?.format;

    for (const operator of ["eq", "gt", "lt"] as const) {
      expect(
        formatOf(operator),
        `create_datetime.${operator} must declare the date format (F2-R)`
      ).toBe("date");
    }
    for (const operator of ["gte", "lte"] as const) {
      expect(
        formatOf(operator),
        `create_datetime.${operator} must declare the date-time format`
      ).toBe("date-time");
    }
    for (const operator of ["before", "after"] as const) {
      expect(
        formatOf(operator),
        `create_datetime.${operator} must carry no format — a relative expression`
      ).toBeUndefined();
    }
  });
});

describe("legacy-invoices criteria schema — the sort vocabulary (AC-3)", () => {
  it("@AC-3 accepts create_datetime and total_amount, in either direction", () => {
    const schema = useQuerySchema();
    expect(
      validates(schema, { sort: [{ field: "create_datetime", dir: "desc" }] })
    ).toBe(true);
    expect(
      validates(schema, { sort: [{ field: "total_amount", dir: "asc" }] })
    ).toBe(true);
  });

  it("@AC-3 refuses a field this module does not declare sortable", () => {
    expect(
      validates(useQuerySchema(), {
        sort: [{ field: "status", dir: "desc" }]
      })
    ).toBe(false);
  });

  it("@AC-3 refuses a direction outside asc/desc", () => {
    expect(
      validates(useQuerySchema(), {
        sort: [{ field: "create_datetime", dir: "sideways" }]
      })
    ).toBe(false);
  });
});

describe("legacy-invoices criteria schema — the page-window defaults (AC-9, D-24)", () => {
  it("@AC-9 declares its OWN limit default of 10 and offset default of 0", () => {
    const model: { pagination?: { limit?: number; offset?: number } } = {
      pagination: {}
    };
    ajv.compile(useQuerySchema() as object)(model as never);
    expect(model.pagination?.limit).toBe(10);
    expect(model.pagination?.offset).toBe(0);
  });
});

describe("legacy-invoices uischema — every control carries an i18n key", () => {
  it("useQueryUischema()'s controls each declare a form i18n key", () => {
    const uischema = useQueryUischema() as {
      elements?: Array<{ i18n?: string }>;
    };
    const controls = uischema.elements ?? [];
    expect(controls.length).toBeGreaterThan(0);
    for (const control of controls) {
      expect(control.i18n, JSON.stringify(control)).toBeTruthy();
    }
  });

  it("useSortUischema() carries an i18n key (ADR-032 2026-08-18 amendment)", () => {
    const sortUischema = useSortUischema() as { i18n?: string };
    expect(sortUischema.i18n).toBeTruthy();
  });
});
