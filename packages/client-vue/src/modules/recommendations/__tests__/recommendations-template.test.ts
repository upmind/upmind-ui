// -----------------------------------------------------------------------------
/**
 * @fileoverview The layout a recommendations page draws for the brand's template
 *
 * ## Job To Be Done
 * Given the raw template the recommendations organism hands its page, the page
 * draws the layout that name carries, and the full layout for no name, an empty
 * name, or a name no recommendations layout carries.
 *
 * ## What Breaks If These Fail
 * A brand with no template, or one written for another page, gets a
 * recommendations page with no layout and no way on.
 */

import { describe, expect, it } from "vitest";
import { RECOMMENDATIONS_TEMPLATE, recommendationsTemplate } from "../index";
import RecommendationsFull from "../templates/RecommendationsFull.template.vue";
import { values } from "lodash-es";
import type { Component } from "vue";

// -----------------------------------------------------------------------------

const LAYOUTS: Record<RECOMMENDATIONS_TEMPLATE, Component> = {
  [RECOMMENDATIONS_TEMPLATE.FULL]: RecommendationsFull
};

// -----------------------------------------------------------------------------

describe("recommendationsTemplate", () => {
  it.each(values(RECOMMENDATIONS_TEMPLATE))(
    "draws the layout the %s template carries",
    template => {
      expect(recommendationsTemplate(template)).toBe(LAYOUTS[template]);
    }
  );

  it.each([
    ["no template", undefined],
    ["an empty template", ""]
  ])("draws the full layout for %s", (_case, template) => {
    expect(recommendationsTemplate(template)).toBe(RecommendationsFull);
  });

  it.each([
    ["a template only other pages carry", "two-column-rtl"],
    ["a name no layout carries", "not-a-template"],
    ["a name every object inherits", "constructor"]
  ])("draws the full layout for %s", (_case, template) => {
    expect(recommendationsTemplate(template)).toBe(RecommendationsFull);
  });
});
