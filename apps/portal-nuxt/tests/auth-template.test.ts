// -----------------------------------------------------------------------------
/**
 * @fileoverview The layout the portal's sign-in page draws for the brand's template
 *
 * ## Job To Be Done
 * Given the raw template each auth organism hands its page, the page draws the
 * layout that name carries, and the left-hand two-column layout for no name, an empty
 * name, or a name no sign-in layout carries.
 *
 * ## What Breaks If These Fail
 * A brand with no template, or one written for another page, gets a sign-in
 * page with no layout.
 */

import { describe, expect, it } from "vitest";
import { authTemplate } from "../app/portal/auth/shell";
import AuthCanvasCard from "../app/portal/auth/templates/AuthCanvasCard.template.vue";
import AuthEnclosed from "../app/portal/auth/templates/AuthEnclosed.template.vue";
import AuthInset from "../app/portal/auth/templates/AuthInset.template.vue";
import AuthLTR from "../app/portal/auth/templates/AuthLTR.template.vue";
import AuthRTL from "../app/portal/auth/templates/AuthRTL.template.vue";
import AuthSplit from "../app/portal/auth/templates/AuthSplit.template.vue";
import AuthSurfaceBox from "../app/portal/auth/templates/AuthSurfaceBox.template.vue";
import { AUTH_TEMPLATE } from "../app/portal/auth/types";
import { values } from "lodash-es";
import type { Component } from "vue";

// -----------------------------------------------------------------------------

const LAYOUTS: Record<AUTH_TEMPLATE, Component> = {
  [AUTH_TEMPLATE.SPLIT]: AuthSplit,
  [AUTH_TEMPLATE.ENCLOSED]: AuthEnclosed,
  [AUTH_TEMPLATE.CANVAS_CARD]: AuthCanvasCard,
  [AUTH_TEMPLATE.SURFACE_BOX]: AuthSurfaceBox,
  [AUTH_TEMPLATE.TWO_COLUMN_LTR]: AuthLTR,
  [AUTH_TEMPLATE.TWO_COLUMN_RTL]: AuthRTL,
  [AUTH_TEMPLATE.INSET]: AuthInset
};

// -----------------------------------------------------------------------------

describe("authTemplate", () => {
  it.each(values(AUTH_TEMPLATE))(
    "draws the layout the %s template carries",
    template => {
      expect(authTemplate(template)).toBe(LAYOUTS[template]);
    }
  );

  it.each([
    ["no template", undefined],
    ["an empty template", ""]
  ])("draws the left-hand two-column layout for %s", (_case, template) => {
    expect(authTemplate(template)).toBe(AuthLTR);
  });

  it.each([
    ["a template only other pages carry", "full"],
    ["a name no layout carries", "not-a-template"],
    ["a name every object inherits", "constructor"]
  ])("draws the left-hand two-column layout for %s", (_case, template) => {
    expect(authTemplate(template)).toBe(AuthLTR);
  });
});
