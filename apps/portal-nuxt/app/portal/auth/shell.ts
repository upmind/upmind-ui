/**
 * @module portal/auth/shell
 * @description The page templates this app hands `@upmind-automation/auth`.
 */

import { resolveTemplate } from "@upmind-automation/foundation";
import AuthCanvasCardTemplate from "./templates/AuthCanvasCard.template.vue";
import AuthEnclosedTemplate from "./templates/AuthEnclosed.template.vue";
import AuthInsetTemplate from "./templates/AuthInset.template.vue";
import AuthLTRTemplate from "./templates/AuthLTR.template.vue";
import AuthRTLTemplate from "./templates/AuthRTL.template.vue";
import AuthSplitTemplate from "./templates/AuthSplit.template.vue";
import AuthSurfaceBoxTemplate from "./templates/AuthSurfaceBox.template.vue";
import { AUTH_TEMPLATE } from "./types";
import type { Component } from "vue";

export const PORTAL_AUTH_TEMPLATES: Record<AUTH_TEMPLATE, Component> = {
  [AUTH_TEMPLATE.SPLIT]: AuthSplitTemplate,
  [AUTH_TEMPLATE.ENCLOSED]: AuthEnclosedTemplate,
  [AUTH_TEMPLATE.CANVAS_CARD]: AuthCanvasCardTemplate,
  [AUTH_TEMPLATE.SURFACE_BOX]: AuthSurfaceBoxTemplate,
  [AUTH_TEMPLATE.TWO_COLUMN_LTR]: AuthLTRTemplate,
  [AUTH_TEMPLATE.TWO_COLUMN_RTL]: AuthRTLTemplate,
  [AUTH_TEMPLATE.INSET]: AuthInsetTemplate
};

export const authTemplate = resolveTemplate(
  PORTAL_AUTH_TEMPLATES,
  AUTH_TEMPLATE.TWO_COLUMN_LTR
);
