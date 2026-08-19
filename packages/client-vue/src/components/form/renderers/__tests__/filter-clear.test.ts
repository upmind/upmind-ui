/**
 * @module form/renderers/__tests__/filter-clear
 * @description The SEARCH box's own clear, measured on the rendered surface and
 * on what it writes. The tri-state's clear is no longer an affordance beside a
 * switch — it is a position of the control itself, proven in
 * `filter-tristate.test.ts`.
 *
 * The clear lives in the box's `#append` slot and stays MOUNTED while the leaf
 * is unset, merely hidden: a clear that mounted and unmounted with the term
 * would resize the box on every keystroke.
 *
 * Polish may not move semantics: clearing leaves the leaf carrying the unset
 * member rather than an empty string the API would filter on (the wire proof is
 * `filter-wire.test.ts`), and the label the ✕ dropped from view must still be
 * its accessible name, resolved through `packages/i18n` — a tooltip is not a
 * replacement for a label in assistive tech.
 */

import { describe, expect, it } from "vitest";
import text from "@upmind-automation/i18n/core/text-en.json";
import {
  clientEmailQuery,
  mountFilters,
  rawKeysIn,
  renderedStrings
} from "./filter.harness";
import { get, includes, trim } from "lodash-es";
import type { DOMWrapper } from "@vue/test-utils";

const SEARCH = "filters.email.like";
const CLEAR = '[data-test-value="all"]';

const shipped = () => mountFilters(clientEmailQuery());

/** The name assistive tech announces for a control. */
const accessibleName = (control: DOMWrapper<Element>): string =>
  trim(
    control.attributes("aria-label") ??
      control.attributes("title") ??
      control.text()
  );

const isHidden = (control: DOMWrapper<Element>) =>
  includes(control.classes(), "invisible");

describe("the search box carries its own clear", () => {
  it("keeps the clear mounted but out of sight until there is a term", async () => {
    const { column, settle } = await shipped();

    expect(column(SEARCH).findAll(CLEAR)).toHaveLength(1);
    expect(isHidden(column(SEARCH).find(CLEAR))).toBe(true);

    await column(SEARCH).find("input").setValue("case");
    await settle();

    expect(column(SEARCH).findAll(CLEAR)).toHaveLength(1);
    expect(isHidden(column(SEARCH).find(CLEAR))).toBe(false);
  });

  it("empties both the box and the leaf, to null rather than an empty string", async () => {
    const { column, model, settle } = await shipped();

    await column(SEARCH).find("input").setValue("case");
    await settle();
    expect(get(model(), ["filters", "email", "like"])).toBe("case");

    await column(SEARCH).find(CLEAR).trigger("click");
    await settle();

    expect(get(model(), ["filters", "email", "like"])).toBeNull();
    expect(
      (column(SEARCH).find("input").element as HTMLInputElement).value
    ).toBe("");
  });

  it("leaves every sibling column standing when it clears its own", async () => {
    const { column, model, settle } = await shipped();

    await column(SEARCH).find("input").setValue("case");
    await settle();
    await column(SEARCH).find(CLEAR).trigger("click");
    await settle();

    expect(get(model(), ["filters", "email", "like"])).toBeNull();
    expect(get(model(), ["filters", "verified", "eq"])).toBeUndefined();
    expect(get(model(), ["filters", "bounced", "eq"])).toBeUndefined();
  });

  it("names itself through packages/i18n rather than rendering a raw key", async () => {
    const { column, settle, wrapper } = await shipped();

    await column(SEARCH).find("input").setValue("case");
    await settle();

    expect(accessibleName(column(SEARCH).find(CLEAR))).toBe(text.all);
    expect(rawKeysIn(renderedStrings(wrapper))).toEqual([]);
  });
});
