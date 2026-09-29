/**
 * @module auth-app/shell
 * @description The page templates this app hands `@upmind-automation/auth`.
 */

import { AUTH_TEMPLATE } from "@upmind-automation/auth";
import AuthCanvasCardTemplate from "./templates/AuthCanvasCard.template.vue";
import AuthEnclosedTemplate from "./templates/AuthEnclosed.template.vue";
import AuthInsetTemplate from "./templates/AuthInset.template.vue";
import AuthLTRTemplate from "./templates/AuthLTR.template.vue";
import AuthRTLTemplate from "./templates/AuthRTL.template.vue";
import AuthSplitTemplate from "./templates/AuthSplit.template.vue";
import AuthSurfaceBoxTemplate from "./templates/AuthSurfaceBox.template.vue";
import type { AuthTemplates } from "@upmind-automation/auth";

export const AUTH_TEMPLATES: AuthTemplates = {
  [AUTH_TEMPLATE.SPLIT]: AuthSplitTemplate,
  [AUTH_TEMPLATE.ENCLOSED]: AuthEnclosedTemplate,
  [AUTH_TEMPLATE.CANVAS_CARD]: AuthCanvasCardTemplate,
  [AUTH_TEMPLATE.SURFACE_BOX]: AuthSurfaceBoxTemplate,
  [AUTH_TEMPLATE.TWO_COLUMN_LTR]: AuthLTRTemplate,
  [AUTH_TEMPLATE.TWO_COLUMN_RTL]: AuthRTLTemplate,
  [AUTH_TEMPLATE.INSET]: AuthInsetTemplate
};
