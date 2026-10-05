// -----------------------------------------------------------------------------
/**
 * @fileoverview The layout a catalogue page draws for the brand's template
 *
 * ## Job To Be Done
 * Given the raw template the catalogue organism hands its page, the page draws
 * the layout that name carries, and the full layout for no name, an empty name,
 * or a name no catalogue layout carries.
 *
 * ## What Breaks If These Fail
 * A brand with no template, or one written for another page, gets a catalogue
 * page with no layout and no way to browse.
 */

import { describe, expect, it } from "vitest";
import { catalogueTemplate } from "../index";
import CatalogueFull from "../templates/CatalogueFull.template.vue";
import { CATALOGUE_TEMPLATE } from "../types";
import { values } from "lodash-es";
import type { Component } from "vue";

// -----------------------------------------------------------------------------

const LAYOUTS: Record<CATALOGUE_TEMPLATE, Component> = {
  [CATALOGUE_TEMPLATE.FULL]: CatalogueFull
};

// -----------------------------------------------------------------------------

describe("catalogueTemplate", () => {
  it.each(values(CATALOGUE_TEMPLATE))(
    "draws the layout the %s template carries",
    template => {
      expect(catalogueTemplate(template)).toBe(LAYOUTS[template]);
    }
  );

  it.each([
    ["no template", undefined],
    ["an empty template", ""]
  ])("draws the full layout for %s", (_case, template) => {
    expect(catalogueTemplate(template)).toBe(CatalogueFull);
  });

  it.each([
    ["a template only other pages carry", "two-column-rtl"],
    ["a name no layout carries", "not-a-template"],
    ["a name every object inherits", "constructor"]
  ])("draws the full layout for %s", (_case, template) => {
    expect(catalogueTemplate(template)).toBe(CatalogueFull);
  });
});
