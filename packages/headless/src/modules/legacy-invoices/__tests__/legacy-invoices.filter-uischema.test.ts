// -----------------------------------------------------------------------------
/**
 * @fileoverview legacy-invoices filter uischema — one hand control per OD4
 * operator leaf (unit, AC-2, AC-10, AC-11; rulings.md F1-R, OD4, OD5)
 *
 * ## Job To Be Done
 * OD4 declares the whole operator branch on the criteria schema, but a hand can
 * only reach an operator the query UISCHEMA draws a control for. Readback F1-R
 * found the uischema drew only the search box (`number.like`) and the range pair
 * (`gte`/`lte`), leaving `eq`, `neq`, `gt`, `lt`, `after` and `before` with no
 * control at all. This pins the fix: `useQueryUischema()` now carries one
 * control per new operator leaf — each bound to a REAL leaf of the OD4 schema
 * `useQuerySchema()` declares, each labelled by a `form.legacy_invoice_*_filter`
 * key that RESOLVES in `form-en.json`, and the search box and range pair still
 * drawn beside them. The expected eleven leaves are spelled as literals here, so
 * the control set is never read back off the schema it is meant to prove.
 *
 * ## What Breaks If These Fail
 * A declared operator with no control is a capability the oracle offered a hand
 * and this page cannot drive (the F1-R gap). A control whose i18n key is absent
 * from `form-en.json` renders its raw key on screen. A dropped search box or
 * range pair is a regression against the controls that already shipped.
 */

import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { useQuerySchema, useQueryUischema } from "../legacy-invoices.schemas";
import { filter, forEach, isArray, isObject, split, values } from "lodash-es";
import type { JsonSchema7 } from "@jsonforms/core";

// -----------------------------------------------------------------------------

type FilterControl = { scope: string; i18n?: string };

/** The eleven per-operator leaves F1-R adds a hand control for (ruling F1-R). */
const NEW_OPERATOR_LEAVES: ReadonlyArray<readonly [string, string]> = [
  ["number", "eq"],
  ["number", "neq"],
  ["total_amount", "eq"],
  ["total_amount", "neq"],
  ["total_amount", "gt"],
  ["total_amount", "lt"],
  ["create_datetime", "eq"],
  ["create_datetime", "gt"],
  ["create_datetime", "lt"],
  ["create_datetime", "after"],
  ["create_datetime", "before"]
];

const catalogue = JSON.parse(
  readFileSync(
    join(
      import.meta.dirname,
      "../../../../../../packages/i18n/src/core/form-en.json"
    ),
    "utf-8"
  )
) as Record<string, { label?: string | null }>;

function collectControls(
  node: unknown,
  acc: FilterControl[] = []
): FilterControl[] {
  if (!isObject(node)) return acc;
  const record = node as Record<string, unknown>;
  if (typeof record.scope === "string") acc.push(record as FilterControl);
  forEach(values(record), value => {
    if (isArray(value)) forEach(value, item => collectControls(item, acc));
    else if (isObject(value)) collectControls(value, acc);
  });
  return acc;
}

/** The last two meaningful segments of a JSON-pointer scope — `[column, operator]`. */
function leafOf(scope: string): [string, string] {
  const segments = filter(
    split(scope, "/"),
    segment => segment !== "" && segment !== "#" && segment !== "properties"
  );
  return [
    segments[segments.length - 2] ?? "",
    segments[segments.length - 1] ?? ""
  ];
}

const lastSegment = (scope: string): string => leafOf(scope)[1];

function schemaLeaf(
  schema: JsonSchema7,
  column: string,
  operator: string
): unknown {
  const filters = schema.properties?.filters as JsonSchema7 | undefined;
  const columnSchema = filters?.properties?.[column] as JsonSchema7 | undefined;
  return columnSchema?.properties?.[operator];
}

const controlsFor = (
  controls: FilterControl[],
  column: string,
  operator: string
): FilterControl[] =>
  filter(controls, control => {
    const [col, op] = leafOf(control.scope);
    return col === column && op === operator;
  });

const hasColumnControl = (controls: FilterControl[], column: string): boolean =>
  filter(controls, control => lastSegment(control.scope) === column).length > 0;

// -----------------------------------------------------------------------------

describe("legacy-invoices filter uischema — one control per OD4 operator leaf (F1-R)", () => {
  it("@AC-2 @AC-10 draws exactly one control for each of the eleven new operator leaves", () => {
    const schema = useQuerySchema();
    const controls = collectControls(useQueryUischema());

    for (const [column, operator] of NEW_OPERATOR_LEAVES) {
      expect(
        schemaLeaf(schema, column, operator),
        `${column}.${operator} is not a real leaf in the OD4 schema`
      ).toBeDefined();
      expect(
        controlsFor(controls, column, operator).length,
        `expected one hand control scoped to ${column}.${operator}`
      ).toBe(1);
    }
  });

  it("@AC-2 @AC-10 labels each new control with a form.legacy_invoice_*_filter key that resolves in form-en.json", () => {
    const controls = collectControls(useQueryUischema());

    for (const [column, operator] of NEW_OPERATOR_LEAVES) {
      const [control] = controlsFor(controls, column, operator);
      expect(
        control?.i18n,
        `${column}.${operator} carries no i18n key`
      ).toMatch(/^form\.legacy_invoice_.*_filter$/);
      const key = control!.i18n!.replace(/^form\./, "");
      expect(
        catalogue[key]?.label,
        `${control!.i18n} is absent from form-en.json`
      ).toBeTruthy();
    }
  });
});

describe("legacy-invoices filter uischema — the search box and range pair are still drawn (F1-R additive)", () => {
  it("@AC-11 still draws the invoice-number search box on the like leaf", () => {
    const controls = collectControls(useQueryUischema());
    expect(controlsFor(controls, "number", "like").length).toBeGreaterThan(0);
  });

  it("@AC-2 still draws the total_amount and create_datetime range pair (gte/lte)", () => {
    const controls = collectControls(useQueryUischema());

    for (const column of ["total_amount", "create_datetime"]) {
      const drawsRange =
        controlsFor(controls, column, "gte").length > 0 ||
        controlsFor(controls, column, "lte").length > 0 ||
        hasColumnControl(controls, column);
      expect(drawsRange, `range pair missing for ${column}`).toBe(true);
    }
  });
});
