// -----------------------------------------------------------------------------
/**
 * @module modules/session/shell
 * @description The page templates this app hands the `@upmind-automation/auth` organisms.
 */

import { resolveTemplate } from "@upmind-automation/foundation";
import SessionCanvasCardTemplate from "./templates/SessionCanvasCard.template.vue";
import SessionEnclosedTemplate from "./templates/SessionEnclosed.template.vue";
import SessionInsetTemplate from "./templates/SessionInset.template.vue";
import SessionLTRTemplate from "./templates/SessionLTR.template.vue";
import SessionRTLTemplate from "./templates/SessionRTL.template.vue";
import SessionSplitTemplate from "./templates/SessionSplit.template.vue";
import SessionSurfaceBoxTemplate from "./templates/SessionSurfaceBox.template.vue";
import { AUTH_TEMPLATE } from "./types";
import type { Component } from "vue";

export const SESSION_TEMPLATES: Record<AUTH_TEMPLATE, Component> = {
  [AUTH_TEMPLATE.SPLIT]: SessionSplitTemplate,
  [AUTH_TEMPLATE.ENCLOSED]: SessionEnclosedTemplate,
  [AUTH_TEMPLATE.CANVAS_CARD]: SessionCanvasCardTemplate,
  [AUTH_TEMPLATE.SURFACE_BOX]: SessionSurfaceBoxTemplate,
  [AUTH_TEMPLATE.TWO_COLUMN_LTR]: SessionLTRTemplate,
  [AUTH_TEMPLATE.TWO_COLUMN_RTL]: SessionRTLTemplate,
  [AUTH_TEMPLATE.INSET]: SessionInsetTemplate
};

export const sessionTemplate = resolveTemplate(
  SESSION_TEMPLATES,
  AUTH_TEMPLATE.TWO_COLUMN_LTR
);
