/**
 * @module auth-app/shell
 * @description The page templates this app hands `@upmind-automation/auth`.
 */

import { AUTH_SHELL } from "@upmind-automation/auth";
import AuthCanvasCardTemplate from "./templates/AuthCanvasCard.template.vue";
import AuthEnclosedTemplate from "./templates/AuthEnclosed.template.vue";
import AuthInsetTemplate from "./templates/AuthInset.template.vue";
import AuthLTRTemplate from "./templates/AuthLTR.template.vue";
import AuthRTLTemplate from "./templates/AuthRTL.template.vue";
import AuthSplitTemplate from "./templates/AuthSplit.template.vue";
import AuthSurfaceBoxTemplate from "./templates/AuthSurfaceBox.template.vue";
import type { ShellComponents } from "@upmind-automation/foundation";

export const AUTH_SHELL_COMPONENTS: ShellComponents = {
  [AUTH_SHELL.TEMPLATE_SPLIT]: AuthSplitTemplate,
  [AUTH_SHELL.TEMPLATE_ENCLOSED]: AuthEnclosedTemplate,
  [AUTH_SHELL.TEMPLATE_CANVAS_CARD]: AuthCanvasCardTemplate,
  [AUTH_SHELL.TEMPLATE_SURFACE_BOX]: AuthSurfaceBoxTemplate,
  [AUTH_SHELL.TEMPLATE_TWO_COLUMN_LTR]: AuthLTRTemplate,
  [AUTH_SHELL.TEMPLATE_TWO_COLUMN_RTL]: AuthRTLTemplate,
  [AUTH_SHELL.TEMPLATE_INSET]: AuthInsetTemplate
};
