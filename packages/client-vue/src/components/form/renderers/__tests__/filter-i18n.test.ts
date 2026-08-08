/**
 * @module form/renderers/__tests__/filter-i18n
 * @description The filter bar's i18n coverage (design §13, tasks 49–50),
 * asserted on the RENDERED string and never on the key — a key-shaped
 * assertion would be green with no translation at all, which is the silent
 * fallback §13.1 documents.
 *
 * Negative control: `filter-i18n.must-fail.patch`.
 */

import { describe, expect, it } from "vitest";
import {
  useQuerySchema,
  useQueryUischema
} from "../../../../../../headless/src/modules/client-email/client-email.schemas";
import form from "../../../../../../i18n/src/core/form-en.json";
import text from "../../../../../../i18n/src/core/text-en.json";
import { labelOf, mountFilters } from "./filter.harness";
import { cloneDeep, get, map, set } from "lodash-es";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";

const I18N_KEY_SHAPE = /^[a-z][a-zA-Z0-9_]*\.[a-zA-Z][a-zA-Z0-9_.]*$/;

const COLUMNS = ["email", "verified", "bounced", "default"];

describe("control labels resolve through packages/i18n", () => {
  it("renders the per-field label form-en.json declares", async () => {
    const { column } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    expect(labelOf(column("verified"))).toBe(form.verified_filter.label);
    expect(labelOf(column("bounced"))).toBe(form.bounced_filter.label);
    expect(labelOf(column("default"))).toBe(form.default_filter.label);
  });

  it("renders no raw i18n key anywhere in the filter bar", async () => {
    const { column } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    const rendered = map(COLUMNS, name => [name, labelOf(column(name))]);

    expect(
      rendered.filter(([, label]) => I18N_KEY_SHAPE.test(label as string))
    ).toEqual([]);
  });

  it("gives the search box the search hint, not the per-email field's address example", async () => {
    const { column } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    const placeholder = column("email").find("input").attributes("placeholder");

    expect(placeholder).toBe(form.email_search.placeholder);
    expect(placeholder).not.toBe(form.email.placeholder);
  });
});

describe("option labels resolve from the column's own oneOf titles", () => {
  it("renders All / Yes / No across the tri-state's three positions", async () => {
    const { column, settle } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    expect(column("verified").text()).toContain(text.all);

    await column("verified").find('[role="switch"]').trigger("click");
    await settle();
    expect(column("verified").text()).toContain(text.yes);

    await column("verified").find('[role="switch"]').trigger("click");
    await settle();
    expect(column("verified").text()).toContain(text.no);
  });

  it("translates an arbitrary enum's titles through the same channel", async () => {
    const schema = cloneDeep(useQuerySchema()) as JsonSchema7;
    set(schema, ["properties", "filters", "properties", "status"], {
      type: "object",
      title: "text.status",
      additionalProperties: false,
      properties: {
        eq: {
          type: ["string", "null"],
          oneOf: [
            { const: "open", title: "text.all" },
            { const: "closed", title: "text.none" }
          ]
        }
      }
    });

    const { column } = await mountFilters({
      schema,
      uischema: {
        type: "VerticalLayout",
        elements: [
          {
            type: "Filter",
            scope: "#/properties/filters/properties/status",
            i18n: "form.status_filter"
          }
        ]
      } as unknown as UISchemaElement
    });

    expect(map(column("status").findAll("option"), o => o.text())).toEqual([
      text.all,
      text.none
    ]);
  });

  it("moves the rendered label when the schema's oneOf title moves", async () => {
    const schema = cloneDeep(useQuerySchema()) as JsonSchema7;
    set(
      schema,
      [
        "properties",
        "filters",
        "properties",
        "verified",
        "properties",
        "eq",
        "oneOf",
        0,
        "title"
      ],
      "text.bounced_label"
    );

    const { column, settle } = await mountFilters({
      schema,
      uischema: useQueryUischema()
    });

    await column("verified").find('[role="switch"]').trigger("click");
    await settle();

    expect(column("verified").text()).toContain(text.bounced_label);
    expect(column("verified").text()).not.toContain(text.yes);
  });
});

describe("the translator is load-bearing", () => {
  it("falls back to the raw schema title when the mount supplies no i18n", async () => {
    const { column } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema(),
      translate: false
    });

    const titleOf = (name: string) =>
      get(useQuerySchema(), [
        "properties",
        "filters",
        "properties",
        name,
        "title"
      ]);

    for (const name of ["verified", "bounced", "default"]) {
      expect(labelOf(column(name))).toBe(titleOf(name));
      expect(I18N_KEY_SHAPE.test(labelOf(column(name)))).toBe(true);
    }
  });
});
