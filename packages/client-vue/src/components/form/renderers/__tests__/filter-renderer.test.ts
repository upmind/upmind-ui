/**
 * @module form/renderers/__tests__/filter-renderer
 * @description The DECLARATION a filter bar makes now that the bespoke `Filter`
 * uiType is gone: every element is a plain `Control`, and its scope resolves to
 * a node the query schema declares — the operator LEAF for a single-ended
 * filter, the column itself for a two-ended range. The leaf's own write is
 * therefore the wire shape, with no renderer in between deciding which operator
 * a column meant.
 *
 * Which control each element draws is `filter-format-dispatch.test.ts`; what a
 * tri-state writes and clears is `filter-tristate.test.ts`.
 *
 * Negative control: `filter-renderer.must-fail.patch`.
 */

import { describe, expect, it } from "vitest";
import {
  clientEmailHistoryQuery,
  clientEmailQuery,
  messagesOf,
  mountFilters,
  rangeQuery
} from "./filter.harness";
import {
  compact,
  every,
  filter,
  get,
  has,
  isEmpty,
  map,
  size,
  uniq
} from "lodash-es";
import type { QueryDeclaration } from "./filter.harness";
import type { JsonSchema7, Layout, UISchemaElement } from "@jsonforms/core";

const shipped = () => mountFilters(clientEmailQuery());

const SEARCH = "filters.email.like";

const elementsOf = (uischema: UISchemaElement) =>
  (uischema as Layout).elements as (UISchemaElement & {
    scope?: string;
    i18n?: string;
  })[];

const nodeAt = (schema: JsonSchema7, scope: string) =>
  get(schema, compact(scope.replace(/^#\//, "").split("/"))) as
    | JsonSchema7
    | undefined;

const bars = [
  ["client-email", clientEmailQuery()],
  ["client-email-history", clientEmailHistoryQuery()]
] as [string, QueryDeclaration][];

describe.each(bars)("the %s bar's declaration", (_name, declaration) => {
  const elements = () => elementsOf(declaration.uischema);

  it("declares every element as a standard Control", () => {
    expect(uniq(map(elements(), "type"))).toEqual(["Control"]);
    expect(elements().length).toBeGreaterThan(0);
  });

  it("resolves every scope to a node the query schema declares", () => {
    expect(
      filter(
        elements(),
        element => !nodeAt(declaration.schema, element.scope as string)
      )
    ).toEqual([]);
  });

  it("scopes an operator leaf, or the column itself for a two-ended range", () => {
    const misscoped = filter(elements(), element => {
      const node = nodeAt(declaration.schema, element.scope as string);
      const isRange = get(element, "options.format") === "range";
      return isRange
        ? size(get(node, "properties")) !== 2
        : !isEmpty(get(node, "properties"));
    });

    expect(map(misscoped, "scope")).toEqual([]);
  });

  it("carries an i18n key and a format on every element", () => {
    expect(
      map(
        filter(
          elements(),
          element => !element.i18n || !get(element, "options.format")
        ),
        "scope"
      )
    ).toEqual([]);
  });

  it("names the bar's own layout rather than a generic one", () => {
    expect(get(declaration.uischema, "type")).toBe("FilterBar");
  });
});

describe("every declared element draws a control", () => {
  it("renders one field per element, none of them empty", async () => {
    const { wrapper } = await shipped();

    const fields = wrapper.findAll('[data-test-key="form-item"]');

    expect(fields).toHaveLength(size(elementsOf(clientEmailQuery().uischema)));
    expect(
      every(fields, field => field.findAll("input,button,select").length > 0)
    ).toBe(true);
  });
});

describe("what a single-ended control writes", () => {
  it("writes its own operator leaf, on its own column only", async () => {
    const { column, model, settle } = await shipped();

    await column(SEARCH).find("input").setValue("case");
    await settle();

    expect(get(model(), ["filters", "email"])).toEqual({ like: "case" });
    expect(has(model(), ["filters", "verified", "eq"])).toBe(false);
    expect(has(model(), ["filters", "bounced", "eq"])).toBe(false);
  });
});

describe("what a two-ended range control writes", () => {
  it("merges the untouched end instead of clearing it", async () => {
    const { column, model, settle } = await mountFilters(rangeQuery());

    const range = column("filters.created_at");

    await range.find('[data-test-value$="-from"]').setValue("2026-01-01");
    await settle();
    await range.find('[data-test-value$="-to"]').setValue("2026-02-01");
    await settle();
    await range.find('[data-test-value$="-from"]').setValue("2026-01-15");
    await settle();

    expect(get(model(), ["filters", "created_at"])).toEqual({
      gte: "2026-01-15",
      lte: "2026-02-01"
    });
  });
});

describe("SB5 — clearing the search leaves the control valid", () => {
  it("reports the schema's minLength failure for a seeded empty string", async () => {
    const { column } = await mountFilters({
      ...clientEmailQuery(),
      model: { filters: { email: { like: "" } } }
    });

    expect(messagesOf(column(SEARCH)).length).toBeGreaterThan(0);
  });

  it("reports nothing once the box is typed into and cleared", async () => {
    const { column, model, settle } = await shipped();

    await column(SEARCH).find("input").setValue("case");
    await settle();
    await column(SEARCH).find("input").setValue("");
    await settle();

    expect(get(model(), ["filters", "email", "like"])).toBeNull();
    expect(messagesOf(column(SEARCH))).toEqual([]);
  });
});
