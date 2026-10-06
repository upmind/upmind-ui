// -----------------------------------------------------------------------------
/**
 * @fileoverview The template pick every host module declares from its own record
 *
 * ## Job To Be Done
 * Given a module's record of page layouts and the layout it falls back to, the
 * pick draws the layout a brand's template names, and the fallback layout for
 * no template, an empty one, or any name that is not one of the record's own
 * entries: an unknown name, a name every object inherits, or a dotted path
 * into one of the layouts.
 *
 * ## What Breaks If These Fail
 * A brand with no template, or a stale one, gets no page; a brand whose
 * template happens to name an object built-in, or a path into a layout, hands
 * the page a function or a string where a layout belongs.
 */

import { describe, expect, it } from "vitest";
import { resolveTemplate } from "../resolveTemplate";
import { values } from "lodash-es";
import type { Component } from "vue";

// -----------------------------------------------------------------------------

const LAYOUT = {
  FULL: "full",
  TWO_COLUMN_LTR: "two-column-ltr",
  TWO_COLUMN_RTL: "two-column-rtl"
} as const;

type Layout = (typeof LAYOUT)[keyof typeof LAYOUT];

const Full: Component = { __name: "Full", render: () => null };
const LTR: Component = { __name: "LTR", render: () => null };
const RTL: Component = { __name: "RTL", render: () => null };

const LAYOUTS: Record<Layout, Component> = {
  [LAYOUT.FULL]: Full,
  [LAYOUT.TWO_COLUMN_LTR]: LTR,
  [LAYOUT.TWO_COLUMN_RTL]: RTL
};

const pick = resolveTemplate(LAYOUTS, LAYOUT.TWO_COLUMN_RTL);

// -----------------------------------------------------------------------------

describe("resolveTemplate", () => {
  it.each(values(LAYOUT))(
    "draws the layout the %s template carries",
    template => {
      expect(pick(template)).toBe(LAYOUTS[template]);
    }
  );

  it("draws the fallback layout when called with no template", () => {
    expect(pick()).toBe(RTL);
  });

  it.each([
    ["an undefined template", undefined],
    ["an empty template", ""],
    ["a name no layout carries", "not-a-template"]
  ])("draws the fallback layout for %s", (_case, template) => {
    expect(pick(template)).toBe(RTL);
  });

  it.each([
    ["a name every object inherits", "constructor"],
    ["an inherited method name", "toString"],
    ["the prototype accessor", "__proto__"],
    ["a dotted path into one of its layouts", `${LAYOUT.FULL}.__name`]
  ])("draws the fallback layout for %s", (_case, template) => {
    expect(pick(template)).toBe(RTL);
  });

  it("falls back to the layout its own declaration names", () => {
    const fullPick = resolveTemplate(LAYOUTS, LAYOUT.FULL);

    expect(fullPick("not-a-template")).toBe(Full);
    expect(pick("not-a-template")).toBe(RTL);
  });
});
