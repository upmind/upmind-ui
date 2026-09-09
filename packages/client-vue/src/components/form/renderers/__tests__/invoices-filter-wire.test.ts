/**
 * @module form/renderers/__tests__/invoices-filter-wire
 * @description The invoices filter bar mounted off the module's own LIVE
 * `useInvoices().as("self").useContext().schemas.query` (never transcribed —
 * see `invoicesQuery` in `filter.harness.ts`), driven, and read back on the
 * WIRE via headless' own `translateQuery`. This bar shipped broken three
 * times behind gates that never mounted it at all, or that graded the model
 * instead of the wire — a nested write (`{status:{code:{in:[...]}}}`) can
 * look identical to a correct one until `translateQuery` runs, because
 * `additionalProperties: false` silently strips the mismatched shape with no
 * ajv error. Every assertion here is post-`translateQuery`.
 *
 * Rendering-shape coverage (declared-element count, Control type, i18n,
 * layout) lives in `filter-renderer.test.ts`, which this file's sibling
 * `invoicesQuery()` entry now shares.
 *
 * Negative control: `invoices-filter-wire.must-fail.patch`.
 */

import { describe, expect, it } from "vitest";
import { translateQuery, useInvoices } from "@upmind-automation/headless";
import { invoicesQuery, mountFilters } from "./filter.harness";
import { get, indexOf, map } from "lodash-es";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";

const declaration = invoicesQuery();

const enumValuesOf = (schema: JsonSchema7, column: string): string[] => {
  const oneOf = get(schema, [
    "properties",
    "filters",
    "properties",
    column,
    "properties",
    "in",
    "items",
    "oneOf"
  ]) as { const: string }[];
  return map(oneOf, "const");
};

const STATUS_COLUMN = "status.code";
const CATEGORY_COLUMN = "category.slug";
const STATUS_PATH = "filters.status.code.in";
const CATEGORY_PATH = "filters.category.slug.in";

const optionTileFor = async (
  path: string,
  schema: JsonSchema7,
  column: string,
  value: string,
  mount: Awaited<ReturnType<typeof mountFilters>>
) => {
  const enumValues = enumValuesOf(schema, column);
  const index = indexOf(enumValues, value);
  const tiles = mount.column(path).findAll('[data-test-key="option-tile"]');
  return { tiles, index, enumValues };
};

describe("the invoices bar mounts off the module's own published schema", () => {
  it("declares exactly 8 elements and renders 8 of 8", async () => {
    const elements = (declaration.uischema as { elements: UISchemaElement[] })
      .elements;
    expect(elements).toHaveLength(8);

    const { wrapper } = await mountFilters(declaration);
    expect(wrapper.findAll('[data-test-key="form-item"]')).toHaveLength(8);
  });

  it("the status facet carries 11 options and the category facet carries 8", async () => {
    const { column } = await mountFilters(declaration);

    expect(
      column(STATUS_PATH).findAll('[data-test-key="option-tile"]')
    ).toHaveLength(11);
    expect(
      column(CATEGORY_PATH).findAll('[data-test-key="option-tile"]')
    ).toHaveLength(8);
  });
});

describe("driving a facet reaches the wire under its declared dotted column", () => {
  it("wires status.code|in and category.slug|in for what was actually clicked", async () => {
    const mount = await mountFilters(declaration);
    const schema = declaration.schema;

    const status = await optionTileFor(
      STATUS_PATH,
      schema,
      STATUS_COLUMN,
      "invoice_unpaid",
      mount
    );
    expect(status.index).toBeGreaterThanOrEqual(0);
    await status.tiles[status.index].trigger("click");
    await mount.settle();

    const category = await optionTileFor(
      CATEGORY_PATH,
      schema,
      CATEGORY_COLUMN,
      "recurrent",
      mount
    );
    expect(category.index).toBeGreaterThanOrEqual(0);
    await category.tiles[category.index].trigger("click");
    await mount.settle();

    const wire = get(translateQuery(schema, mount.model()), "filters") as
      | Record<string, string>
      | undefined;

    expect(wire?.["filter[status.code|in]"]).toBe("invoice_unpaid");
    expect(wire?.["filter[category.slug|in]"]).toBe("recurrent");
  });

  it("FAIRNESS CONTROL — a non-dotted column reaches the wire the same way", async () => {
    const mount = await mountFilters(declaration);

    await mount
      .column("filters.number.eq")
      .find("input")
      .setValue("INV-2026-100");
    await mount.settle();

    const wire = get(
      translateQuery(declaration.schema, mount.model()),
      "filters"
    ) as Record<string, string> | undefined;

    expect(wire?.["filter[number|eq]"]).toBe("INV-2026-100");
  });
});

describe("the published schema is the same instance the scoped composable exposes", () => {
  it("comes straight off useInvoices().as('self').useContext().schemas.query", () => {
    const live = useInvoices().as("self").useContext().schemas.query;
    expect(declaration.schema).toEqual(live.schema);
    expect(declaration.uischema).toEqual(live.uischema);
  });
});
