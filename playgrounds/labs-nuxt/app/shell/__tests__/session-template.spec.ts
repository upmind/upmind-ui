// -----------------------------------------------------------------------------
/**
 * @fileoverview The layout the labs's sign-in page draws for the brand's template
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
import { sessionTemplate } from "../shell";
import SessionCanvasCard from "../modules/session/templates/SessionCanvasCard.template.vue";
import SessionEnclosed from "../modules/session/templates/SessionEnclosed.template.vue";
import SessionInset from "../modules/session/templates/SessionInset.template.vue";
import SessionLTR from "../modules/session/templates/SessionLTR.template.vue";
import SessionRTL from "../modules/session/templates/SessionRTL.template.vue";
import SessionSplit from "../modules/session/templates/SessionSplit.template.vue";
import SessionSurfaceBox from "../modules/session/templates/SessionSurfaceBox.template.vue";
import { AUTH_TEMPLATE } from "../modules/session/types";
import { values } from "lodash-es";
import type { Component } from "vue";

// -----------------------------------------------------------------------------

const LAYOUTS: Record<AUTH_TEMPLATE, Component> = {
  [AUTH_TEMPLATE.SPLIT]: SessionSplit,
  [AUTH_TEMPLATE.ENCLOSED]: SessionEnclosed,
  [AUTH_TEMPLATE.CANVAS_CARD]: SessionCanvasCard,
  [AUTH_TEMPLATE.SURFACE_BOX]: SessionSurfaceBox,
  [AUTH_TEMPLATE.TWO_COLUMN_LTR]: SessionLTR,
  [AUTH_TEMPLATE.TWO_COLUMN_RTL]: SessionRTL,
  [AUTH_TEMPLATE.INSET]: SessionInset
};

// -----------------------------------------------------------------------------

describe("sessionTemplate", () => {
  it.each(values(AUTH_TEMPLATE))(
    "draws the layout the %s template carries",
    template => {
      expect(sessionTemplate(template)).toBe(LAYOUTS[template]);
    }
  );

  it.each([
    ["no template", undefined],
    ["an empty template", ""]
  ])("draws the left-hand two-column layout for %s", (_case, template) => {
    expect(sessionTemplate(template)).toBe(SessionLTR);
  });

  it.each([
    ["a template only other pages carry", "full"],
    ["a name no layout carries", "not-a-template"],
    ["a name every object inherits", "constructor"]
  ])("draws the left-hand two-column layout for %s", (_case, template) => {
    expect(sessionTemplate(template)).toBe(SessionLTR);
  });
});
