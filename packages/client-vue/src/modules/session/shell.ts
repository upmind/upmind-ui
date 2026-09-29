// -----------------------------------------------------------------------------
/**
 * @module modules/session/shell
 * @description The page templates this package hands the `@upmind-automation/auth` organisms.
 */

import { AUTH_TEMPLATE } from "@upmind-automation/auth";
import SessionCanvasCardTemplate from "./templates/SessionCanvasCard.template.vue";
import SessionEnclosedTemplate from "./templates/SessionEnclosed.template.vue";
import SessionInsetTemplate from "./templates/SessionInset.template.vue";
import SessionLTRTemplate from "./templates/SessionLTR.template.vue";
import SessionRTLTemplate from "./templates/SessionRTL.template.vue";
import SessionSplitTemplate from "./templates/SessionSplit.template.vue";
import SessionSurfaceBoxTemplate from "./templates/SessionSurfaceBox.template.vue";
import type { AuthTemplates } from "@upmind-automation/auth";

export const SESSION_TEMPLATES: AuthTemplates = {
  [AUTH_TEMPLATE.SPLIT]: SessionSplitTemplate,
  [AUTH_TEMPLATE.ENCLOSED]: SessionEnclosedTemplate,
  [AUTH_TEMPLATE.CANVAS_CARD]: SessionCanvasCardTemplate,
  [AUTH_TEMPLATE.SURFACE_BOX]: SessionSurfaceBoxTemplate,
  [AUTH_TEMPLATE.TWO_COLUMN_LTR]: SessionLTRTemplate,
  [AUTH_TEMPLATE.TWO_COLUMN_RTL]: SessionRTLTemplate,
  [AUTH_TEMPLATE.INSET]: SessionInsetTemplate
};
