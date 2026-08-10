/**
 * @module form/renderers/__tests__/filter-renderer
 * @description The `Filter` renderer family's dispatch contract (design §12,
 * tasks 46–48): the uischema scopes the COLUMN, the BRANCH is chosen from that
 * column's own declared operators, a cleared search validates clean (SB5), and
 * a column no branch claims fails loudly instead of rendering nothing.
 *
 * Which of the two CONTROLS a boolean branch draws is the uischema's call, not
 * the schema's — proven in `filter-treatment.test.ts`; what the tri-state writes
 * and clears is proven in `filter-clear-unset.test.ts`.
 *
 * Negative control: `filter-renderer.must-fail.patch`.
 */

import { describe, expect, it } from "vitest";
import {
  useQuerySchema,
  useQueryUischema
} from "@upmind-automation/headless-test-kit/client-email.internal-kit";
import error from "../../../../../../i18n/src/core/error-en.json";
import {
  labelOf,
  messagesOf,
  mountFilters,
  positionsOf
} from "./filter.harness";
import { cloneDeep, filter, get, has, map, set, some } from "lodash-es";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";

type UiElement = UISchemaElement & {
  scope?: string;
  i18n?: string;
  elements?: UiElement[];
};

const FILTER_ELEMENT_TYPE = "Filter";

const flatten = (element: UiElement): UiElement[] => [
  element,
  ...(element?.elements ?? []).flatMap(flatten)
];

const filterElements = () =>
  filter(
    flatten(useQueryUischema()),
    element => get(element, "type") === FILTER_ELEMENT_TYPE
  );

const columnAt = (scope: string) =>
  get(
    useQuerySchema(),
    scope.replace(/^#\//, "").split("/").filter(Boolean)
  ) as JsonSchema7 | undefined;

describe("the declaration a Filter element makes", () => {
  it("scopes the column and never its operator", () => {
    const scopes = map(filterElements(), "scope");

    expect(scopes).toHaveLength(3);
    expect(
      some(scopes, scope =>
        /\/properties\/(eq|like|gte|lte|nlike)$/.test(scope)
      )
    ).toBe(false);
  });

  it("resolves every scope to a declared column carrying operators", () => {
    const columns = map(filterElements(), element =>
      columnAt(element.scope as string)
    );

    expect(some(columns, column => !column)).toBe(false);
    expect(
      some(columns, column => !Object.keys(column?.properties ?? {}).length)
    ).toBe(false);
  });

  it("carries an i18n key on every element", () => {
    expect(filter(filterElements(), element => !get(element, "i18n"))).toEqual(
      []
    );
  });
});

describe("the control is chosen from the column's own schema", () => {
  it("draws chooseable positions for a boolean eq column and a text box for a like column", async () => {
    const { column } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    for (const name of ["verified", "bounced"]) {
      expect(positionsOf(column(name)).length).toBeGreaterThan(1);
      expect(column(name).findAll("select")).toHaveLength(0);
      expect(column(name).findAll("input")).toHaveLength(0);
    }

    expect(positionsOf(column("email"))).toEqual([]);
    expect(column("email").find('input[type="text"]').exists()).toBe(true);
  });

  it("draws a select for an enumerated eq column and a paired range for gte+lte", async () => {
    const schema = cloneDeep(useQuerySchema()) as JsonSchema7;
    set(schema, ["properties", "filters", "properties", "status"], {
      type: "object",
      title: "text.status",
      additionalProperties: false,
      properties: {
        eq: {
          type: ["string", "null"],
          oneOf: [
            { const: "open", title: "text.yes" },
            { const: "closed", title: "text.no" }
          ]
        }
      }
    });
    set(schema, ["properties", "filters", "properties", "created_at"], {
      type: "object",
      title: "text.date",
      additionalProperties: false,
      properties: {
        gte: { type: ["string", "null"] },
        lte: { type: ["string", "null"] }
      }
    });

    const { column } = await mountFilters({
      schema,
      uischema: {
        type: "VerticalLayout",
        elements: [
          {
            type: FILTER_ELEMENT_TYPE,
            scope: "#/properties/filters/properties/status",
            i18n: "form.status_filter"
          },
          {
            type: FILTER_ELEMENT_TYPE,
            scope: "#/properties/filters/properties/created_at",
            i18n: "form.created_at_filter"
          }
        ]
      } as unknown as UISchemaElement
    });

    expect(
      map(column("status").findAll("option"), o => o.attributes("value"))
    ).toEqual(["open", "closed"]);

    expect(
      column("created-at").find('[data-test-value$="-from"]').exists()
    ).toBe(true);
    expect(column("created-at").find('[data-test-value$="-to"]').exists()).toBe(
      true
    );
  });
});

describe("what the control writes", () => {
  it("writes the operator leaf the column declares, on that column only", async () => {
    const { column, model, settle } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    await column("email").find("input").setValue("case");
    await settle();

    expect(get(model(), ["filters", "email"])).toEqual({ like: "case" });
    expect(has(model(), ["filters", "verified", "eq"])).toBe(false);
    expect(has(model(), ["filters", "bounced", "eq"])).toBe(false);
  });

  it("merges the untouched end of a range instead of clearing it", async () => {
    const schema = cloneDeep(useQuerySchema()) as JsonSchema7;
    set(schema, ["properties", "filters", "properties", "created_at"], {
      type: "object",
      title: "text.date",
      additionalProperties: false,
      properties: {
        gte: { type: ["string", "null"] },
        lte: { type: ["string", "null"] }
      }
    });

    const { column, model, settle } = await mountFilters({
      schema,
      uischema: {
        type: "VerticalLayout",
        elements: [
          {
            type: FILTER_ELEMENT_TYPE,
            scope: "#/properties/filters/properties/created_at",
            i18n: "form.created_at_filter"
          }
        ]
      } as unknown as UISchemaElement
    });

    const range = column("created-at");
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
      schema: useQuerySchema(),
      uischema: useQueryUischema(),
      model: { filters: { email: { like: "" } } }
    });

    expect(messagesOf(column("email")).length).toBeGreaterThan(0);
  });

  it("reports nothing once the box is typed into and cleared", async () => {
    const { column, model, settle } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    await column("email").find("input").setValue("case");
    await settle();
    await column("email").find("input").setValue("");
    await settle();

    expect(get(model(), ["filters", "email"])).toEqual({});
    expect(messagesOf(column("email"))).toEqual([]);
  });
});

describe("an unhandled operator shape fails loudly", () => {
  it("draws the form's error affordance in place of a control, and does not throw", async () => {
    const schema = cloneDeep(useQuerySchema()) as JsonSchema7;
    set(schema, ["properties", "filters", "properties", "weird"], {
      type: "object",
      title: "text.weird",
      additionalProperties: false,
      properties: { between: { type: ["string", "null"] } }
    });

    const { column } = await mountFilters({
      schema,
      uischema: {
        type: "VerticalLayout",
        elements: [
          {
            type: FILTER_ELEMENT_TYPE,
            scope: "#/properties/filters/properties/weird",
            i18n: "form.weird_filter"
          }
        ]
      } as unknown as UISchemaElement
    });

    expect(column("weird").exists()).toBe(true);
    expect(column("weird").findAll("input")).toHaveLength(0);
    expect(column("weird").findAll("select")).toHaveLength(0);
    expect(messagesOf(column("weird"))).toEqual([error.filter_unsupported]);
    expect(labelOf(column("weird"))).toBeTruthy();
  });
});
