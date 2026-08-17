/**
 * @module form/renderers/__tests__/filter-clear
 * @description The SEARCH box's own clear (Wave C · G5, C7), measured on the
 * rendered surface and on what it writes. The tri-state's clear is no longer an
 * affordance beside a switch — it is a position of the control itself, proven in
 * `filter-clear-unset.test.ts`.
 *
 * Polish may not move semantics: clearing empties the leaf rather than writing
 * `""` or `null`, and the label the ✕ dropped from view must still be its
 * accessible name, resolved through `packages/i18n` — a tooltip is not a
 * replacement for a label in assistive tech.
 */

import { describe, expect, it } from "vitest";
import { internalKits } from "@upmind-automation/headless/testing";
import text from "@upmind-automation/i18n/core/text-en.json";
import { mountFilters, renderedStrings } from "./filter.harness";
import { filter, get, has, trim } from "lodash-es";
import type { DOMWrapper } from "@vue/test-utils";

const { useQuerySchema, useQueryUischema } =
  await internalKits["client-email"]();

const CLEAR = '[data-test-value="all"]';
const I18N_KEY_SHAPE = /^[a-z][a-zA-Z0-9_]*\.[a-zA-Z][a-zA-Z0-9_.]*$/;

/** The name assistive tech announces for a control. */
const accessibleName = (control: DOMWrapper<Element>): string =>
  trim(
    control.attributes("aria-label") ??
      control.attributes("title") ??
      control.text()
  );

describe("the search box carries its own clear (C7)", () => {
  it("surfaces a clear once typed into, and empties both the box and the leaf", async () => {
    const { column, model, settle } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    expect(column("email").findAll(CLEAR)).toHaveLength(0);

    await column("email").find("input").setValue("case");
    await settle();
    expect(column("email").findAll(CLEAR)).toHaveLength(1);

    await column("email").find(CLEAR).trigger("click");
    await settle();

    const leaf = get(model(), ["filters", "email"]);
    expect(leaf).toEqual({});
    expect(has(leaf, "like")).toBe(false);
    expect(
      (column("email").find("input").element as HTMLInputElement).value
    ).toBe("");
  });

  it("names itself through packages/i18n rather than rendering a raw key", async () => {
    const { column, settle, wrapper } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    await column("email").find("input").setValue("case");
    await settle();

    expect(accessibleName(column("email").find(CLEAR))).toBe(text.all);
    expect(
      filter(renderedStrings(wrapper), string => I18N_KEY_SHAPE.test(string))
    ).toEqual([]);
  });
});
