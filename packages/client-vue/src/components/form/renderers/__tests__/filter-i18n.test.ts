/**
 * @module form/renderers/__tests__/filter-i18n
 * @description The filter bar's i18n coverage (design §13, tasks 49–50),
 * asserted on the RENDERED string and never on the key — a key-shaped
 * assertion would be green with no translation at all, which is the silent
 * fallback §13.1 documents.
 *
 * Negative control: `filter-i18n.must-fail.patch`.
 */

import { mount } from "@vue/test-utils";
import { describe, expect, it } from "vitest";
import { h } from "vue";
import { internalKits } from "@upmind-automation/headless/testing";
import form from "@upmind-automation/i18n/core/form-en.json";
import text from "@upmind-automation/i18n/core/text-en.json";
import {
  labelOf,
  mountFilters,
  positionAt,
  positionsOf,
  renderedStrings
} from "./filter.harness";
import { cloneDeep, filter, get, map, set } from "lodash-es";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";

const { useQuerySchema, useQueryUischema } =
  await internalKits["client-email"]();

const I18N_KEY_SHAPE = /^[a-z][a-zA-Z0-9_]*\.[a-zA-Z][a-zA-Z0-9_.]*$/;

const rawKeysIn = (strings: string[]) =>
  filter(strings, string => I18N_KEY_SHAPE.test(string));

describe("control labels resolve through packages/i18n", () => {
  it("renders the per-field label form-en.json declares", async () => {
    const { column } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    expect(labelOf(column("verified"))).toBe(form.verified_filter.label);
  });

  it("renders no raw i18n key anywhere in the filter bar, at any position", async () => {
    const { column, settle, wrapper } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    for (const value of ["yes", "no", "all"]) {
      expect(rawKeysIn(renderedStrings(wrapper))).toEqual([]);
      await positionAt(column("verified"), value).trigger("click");
      await settle();
    }

    expect(rawKeysIn(renderedStrings(wrapper))).toEqual([]);
  });

  it("draws no label at all for the column whose key declares none", async () => {
    const { column } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    expect(form.email_search.label).toBeNull();
    expect(column("email").findAll("label")).toHaveLength(0);
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
    const { column } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    expect(positionsOf(column("verified"))).toEqual([
      text.all,
      text.yes,
      text.no
    ]);
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
      "text.none"
    );

    const { column } = await mountFilters({
      schema,
      uischema: useQueryUischema()
    });

    expect(positionsOf(column("verified"))).toEqual([
      text.all,
      text.none,
      text.no
    ]);
  });
});

describe("the sweep the no-raw-key assertion rests on", () => {
  it("sees a key that shares its element with an element child", () => {
    const wrapper = mount({
      render: () => h("label", [h("span", "Verified"), " form.verified_filter"])
    });

    expect(rawKeysIn(renderedStrings(wrapper))).toEqual([
      "form.verified_filter"
    ]);
  });
});

describe("the translator is load-bearing", () => {
  it("falls back to the raw schema title when the mount supplies no i18n", async () => {
    const { column, wrapper } = await mountFilters({
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

    expect(labelOf(column("verified"))).toBe(titleOf("verified"));
    // A schema `title` is plain English, so the untranslated fallback is a
    // readable word — this goes red the day a key is put back in a title.
    expect(I18N_KEY_SHAPE.test(labelOf(column("verified")))).toBe(false);

    expect(rawKeysIn(renderedStrings(wrapper)).length).toBeGreaterThan(0);
  });
});
