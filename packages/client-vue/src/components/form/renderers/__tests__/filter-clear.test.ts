/**
 * @module form/renderers/__tests__/filter-clear
 * @description The clear affordances the polish pass moved (Wave C · G5,
 * C6/C7): the tri-state's clear folded into the switch and the search box's own
 * clear, measured on the RENDERED surface and on what each one WRITES.
 *
 * Polish may not move semantics: the unset position still empties the leaf
 * rather than writing `""` or `null`, and the label the ✕ dropped from view
 * must still be its accessible name, resolved through `packages/i18n` — a
 * tooltip is not a replacement for a label in assistive tech.
 */

import { describe, expect, it } from "vitest";
import {
  useQuerySchema,
  useQueryUischema
} from "@upmind-automation/headless-test-kit/client-email.internal-kit";
import text from "../../../../../../i18n/src/core/text-en.json";
import { mountFilters, renderedStrings } from "./filter.harness";
import {
  compact,
  filter,
  flatMap,
  get,
  has,
  map,
  trim,
  values
} from "lodash-es";
import type { DOMWrapper, VueWrapper } from "@vue/test-utils";

const CLEAR = '[data-test-value="all"]';
const SWITCH = '[role="switch"]';
const I18N_KEY_SHAPE = /^[a-z][a-zA-Z0-9_]*\.[a-zA-Z][a-zA-Z0-9_.]*$/;

/** Hidden from sight but not from assistive tech, and hidden from both. */
const VISUALLY_HIDDEN = '.sr-only,[hidden],[aria-hidden="true"]';

/** What a sighted user can read — the sr-only accessible names excluded. */
const visibleStrings = (root: VueWrapper | DOMWrapper<Element>): string[] =>
  compact(
    flatMap(
      filter(
        map(root.findAll("*"), node => node.element),
        element => !element.closest(VISUALLY_HIDDEN)
      ),
      element =>
        map(
          filter(element.childNodes, node => node.nodeType === Node.TEXT_NODE),
          node => trim(node.textContent ?? "")
        )
    )
  );

/** The name assistive tech announces for a control. */
const accessibleName = (control: DOMWrapper<Element>): string =>
  trim(
    control.attributes("aria-label") ??
      control.attributes("title") ??
      control.text()
  );

describe("the tri-state's clear is part of the switch (C6)", () => {
  it("offers no clear until a position is chosen", async () => {
    const { column, settle } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    expect(column("verified").findAll(CLEAR)).toHaveLength(0);

    await column("verified").find(SWITCH).trigger("click");
    await settle();

    expect(column("verified").findAll(CLEAR)).toHaveLength(1);
  });

  it("clears back to the unset position, writing no value at all", async () => {
    const { column, model, settle } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    await column("verified").find(SWITCH).trigger("click");
    await settle();
    await column("verified").find(CLEAR).trigger("click");
    await settle();

    const leaf = get(model(), ["filters", "verified"]);
    expect(leaf).toEqual({});
    expect(has(leaf, "eq")).toBe(false);
    expect(values(leaf)).toEqual([]);
    expect(column("verified").findAll(CLEAR)).toHaveLength(0);
    expect(visibleStrings(column("verified"))).toContain(text.all);
  });

  it("drops the clear's label from view without dropping it from assistive tech", async () => {
    const { column, settle } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    await column("verified").find(SWITCH).trigger("click");
    await settle();

    expect(accessibleName(column("verified").find(CLEAR))).toBe(text.all);
    expect(visibleStrings(column("verified"))).not.toContain(text.all);
    expect(visibleStrings(column("verified"))).toContain(text.yes);
  });
});

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
});

describe("both clear affordances name themselves through packages/i18n", () => {
  it("renders no raw key on either control, in any position", async () => {
    const { column, settle, wrapper } = await mountFilters({
      schema: useQuerySchema(),
      uischema: useQueryUischema()
    });

    await column("verified").find(SWITCH).trigger("click");
    await column("email").find("input").setValue("case");
    await settle();

    expect(column("verified").findAll(CLEAR)).toHaveLength(1);
    expect(column("email").findAll(CLEAR)).toHaveLength(1);
    expect(
      filter(renderedStrings(wrapper), string => I18N_KEY_SHAPE.test(string))
    ).toEqual([]);
    expect(accessibleName(column("email").find(CLEAR))).toBe(text.all);
  });
});
