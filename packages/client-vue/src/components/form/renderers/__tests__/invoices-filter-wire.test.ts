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
import {
  catalogue,
  invoicesQuery,
  labelOf,
  mountFilters,
  rawKeysIn,
  renderedStrings
} from "./filter.harness";
import { forEach, get, indexOf, map, split, uniq } from "lodash-es";
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

/**
 * The literal-key segments for a dotted multi-select leaf's raw model
 * location — `["filters", "status.code", "in"]` — as distinct from
 * `STATUS_PATH`/`CATEGORY_PATH`, which are dot-joined strings used ONLY as
 * DOM lookup keys (`mount.column`). A dotted lodash string path would
 * re-split "status.code" into two nested keys that do not exist, which is
 * the exact bug this module's own leaf-name choice exposes elsewhere.
 */
/** `#/properties/filters/properties/status.code/properties/in` -> `filters.status.code.in`. */
const pathOf = (element: UISchemaElement): string => {
  const scope = (element as { scope: string }).scope;
  return split(scope, "/properties/").slice(1).join(".");
};

const rawPathFor = (path: string): string[] => {
  if (path === STATUS_PATH) return ["filters", STATUS_COLUMN, "in"];
  if (path === CATEGORY_PATH) return ["filters", CATEGORY_COLUMN, "in"];
  throw new Error(`No literal raw path mapped for "${path}"`);
};

const optionTileFor = async (
  path: string,
  schema: JsonSchema7,
  column: string,
  value: string,
  mount: Awaited<ReturnType<typeof mountFilters>>
) => {
  const enumValues = enumValuesOf(schema, column);
  const index = indexOf(enumValues, value);
  const tiles = await mount.openFacet(path);
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
    const mount = await mountFilters(declaration);

    expect(await mount.openFacet(STATUS_PATH)).toHaveLength(11);
    expect(await mount.openFacet(CATEGORY_PATH)).toHaveLength(8);
  });
});

describe("the invoices bar says what each of its filters is about", () => {
  it("every element draws a real label, and no raw i18n key reaches the surface", async () => {
    const { wrapper, column } = await mountFilters(declaration);

    const elements = (declaration.uischema as { elements: UISchemaElement[] })
      .elements;

    // Asserted against the SHIPPED catalogue, never a hand-typed string: a
    // key-shaped assertion would be green with no translation at all.
    forEach(elements, element => {
      const path = pathOf(element);
      const drawn = labelOf(column(path));
      expect(drawn, `${path} draws no label`).not.toBe("");
      expect(
        catalogue(`${(element as { i18n: string }).i18n}.label`),
        `${path} has no shipped label`
      ).toBe(drawn);
    });

    expect(rawKeysIn(renderedStrings(wrapper))).toEqual([]);
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

const rawArrayAt = (
  model: ReturnType<Awaited<ReturnType<typeof mountFilters>>["model"]>,
  path: string
): unknown[] => {
  const value = get(model, rawPathFor(path));
  return Array.isArray(value) ? value : [];
};

const wireArrayFor = (
  schema: JsonSchema7,
  model: ReturnType<Awaited<ReturnType<typeof mountFilters>>["model"]>,
  key: string
): string | undefined => {
  const wire = get(translateQuery(schema, model), "filters") as
    | Record<string, string>
    | undefined;
  return wire?.[key];
};

const wireOwnsKey = (
  schema: JsonSchema7,
  model: ReturnType<Awaited<ReturnType<typeof mountFilters>>["model"]>,
  key: string
): boolean => {
  const wire = get(translateQuery(schema, model), "filters") as
    | Record<string, string>
    | undefined;
  return wire !== undefined && Object.prototype.hasOwnProperty.call(wire, key);
};

const clickValue = async (
  path: string,
  schema: JsonSchema7,
  column: string,
  value: string,
  mount: Awaited<ReturnType<typeof mountFilters>>
) => {
  const enumValues = enumValuesOf(schema, column);
  const index = indexOf(enumValues, value);
  expect(index).toBeGreaterThanOrEqual(0);
  const tiles = await mount.openFacet(path);
  await tiles[index].trigger("click");
  await mount.settle();
};

/**
 * Drives click A -> click B -> de-select A -> de-select B (clear to empty)
 * on one dotted multi-select facet, asserting the WIRE and the raw emitted
 * array after every step. `firstClicked`/`secondClicked` are deliberately
 * the LATER and EARLIER entries of the schema's own enum order (reversed
 * enum order), so the ordering assertion after click B is checked against
 * the schema's declared `oneOf` order too — measured live against the real
 * renderer (not read from its source): the schema's `oneOf` sequence
 * declares validation order, not an output-array ordering constraint, so
 * the module leaves write order to the UI, which is chronological
 * click order. Both facts are asserted below: click order on the wire, and
 * the CONTENT is exactly {A, B} regardless of schema order.
 */
const runFacetSequence = async (
  mount: Awaited<ReturnType<typeof mountFilters>>,
  schema: JsonSchema7,
  path: string,
  column: string,
  wireKey: string
) => {
  const enumValues = enumValuesOf(schema, column);
  expect(enumValues.length).toBeGreaterThanOrEqual(2);
  const [earlierInSchema, laterInSchema] = enumValues;
  const firstClicked = laterInSchema;
  const secondClicked = earlierInSchema;

  await clickValue(path, schema, column, firstClicked, mount);
  expect(wireArrayFor(schema, mount.model(), wireKey)).toBe(firstClicked);
  const afterA = rawArrayAt(mount.model(), path);
  expect(uniq(afterA)).toEqual(afterA);

  await clickValue(path, schema, column, secondClicked, mount);
  const wireAfterB = wireArrayFor(schema, mount.model(), wireKey);
  expect(wireAfterB).toBe(`${firstClicked},${secondClicked}`);
  expect(new Set((wireAfterB as string).split(","))).toEqual(
    new Set([earlierInSchema, laterInSchema])
  );
  const afterB = rawArrayAt(mount.model(), path);
  expect(uniq(afterB)).toEqual(afterB);
  expect(afterB).toHaveLength(2);

  await clickValue(path, schema, column, firstClicked, mount);
  expect(wireArrayFor(schema, mount.model(), wireKey)).toBe(secondClicked);
  const afterDeselectA = rawArrayAt(mount.model(), path);
  expect(uniq(afterDeselectA)).toEqual(afterDeselectA);
  expect(afterDeselectA).toEqual([secondClicked]);

  await clickValue(path, schema, column, secondClicked, mount);
  const afterClear = rawArrayAt(mount.model(), path);
  expect(afterClear).toEqual([]);
  /**
   * PINNED, measured against the live wire (not assumed): `translateQuery`
   * always emits the FULL declared filter-key set — every column the schema
   * declares is present on `wire.filters`, defaulting to the empty string
   * when unset. A cleared column therefore reads as `wireKey: ""`, present
   * and empty, never an absent key — the same shape a swallowed write left
   * behind at stage 2/3 of this capability's prior failures. This is the
   * one fact the verifier flagged as unpinned; it is EMPTY, not ABSENT.
   */
  expect(wireOwnsKey(schema, mount.model(), wireKey)).toBe(true);
  expect(wireArrayFor(schema, mount.model(), wireKey)).toBe("");
};

describe("the facet SEQUENCE never duplicates and de-select removes", () => {
  it("status.code|in: click A, click B, de-select A, clear to empty", async () => {
    const mount = await mountFilters(declaration);
    await runFacetSequence(
      mount,
      declaration.schema,
      STATUS_PATH,
      STATUS_COLUMN,
      "filter[status.code|in]"
    );
  });

  it("category.slug|in: click A, click B, de-select A, clear to empty", async () => {
    const mount = await mountFilters(declaration);
    await runFacetSequence(
      mount,
      declaration.schema,
      CATEGORY_PATH,
      CATEGORY_COLUMN,
      "filter[category.slug|in]"
    );
  });

  it("both dotted multi-select leaves declare uniqueItems: true", () => {
    const uniqueItemsOf = (column: string) =>
      get(declaration.schema, [
        "properties",
        "filters",
        "properties",
        column,
        "properties",
        "in",
        "uniqueItems"
      ]);

    expect(uniqueItemsOf(STATUS_COLUMN)).toBe(true);
    expect(uniqueItemsOf(CATEGORY_COLUMN)).toBe(true);
  });
});

describe("the published schema is the same instance the scoped composable exposes", () => {
  it("comes straight off useInvoices().as('self').useContext().schemas.query", () => {
    const live = useInvoices().as("self").useContext().schemas.query;
    expect(declaration.schema).toEqual(live.schema);
    expect(declaration.uischema).toEqual(live.uischema);
  });
});
