// -----------------------------------------------------------------------------
/**
 * @module modules/session/shell
 * @description The shell entries this package hands `@upmind-automation/auth`
 * through `foundation`'s shell socket: the seven page templates (Amendment 1
 * change 3 keeps layouts app-owned, and these are still app-side while the
 * shell lives here), the loading interstitial, and the basket-summary aside.
 */

import { AUTH_SHELL } from "@upmind-automation/auth";
import Loading from "../system/Loading.vue";
import SessionSummary from "./components/SessionSummary.vue";
import SessionCanvasCardTemplate from "./templates/SessionCanvasCard.template.vue";
import SessionEnclosedTemplate from "./templates/SessionEnclosed.template.vue";
import SessionInsetTemplate from "./templates/SessionInset.template.vue";
import SessionLTRTemplate from "./templates/SessionLTR.template.vue";
import SessionRTLTemplate from "./templates/SessionRTL.template.vue";
import SessionSplitTemplate from "./templates/SessionSplit.template.vue";
import SessionSurfaceBoxTemplate from "./templates/SessionSurfaceBox.template.vue";
import type { ShellComponents } from "@upmind-automation/foundation";

export const SESSION_SHELL_COMPONENTS: ShellComponents = {
  [AUTH_SHELL.LOADING]: Loading,
  [AUTH_SHELL.SUMMARY]: SessionSummary,
  [AUTH_SHELL.TEMPLATE_SPLIT]: SessionSplitTemplate,
  [AUTH_SHELL.TEMPLATE_ENCLOSED]: SessionEnclosedTemplate,
  [AUTH_SHELL.TEMPLATE_CANVAS_CARD]: SessionCanvasCardTemplate,
  [AUTH_SHELL.TEMPLATE_SURFACE_BOX]: SessionSurfaceBoxTemplate,
  [AUTH_SHELL.TEMPLATE_TWO_COLUMN_LTR]: SessionLTRTemplate,
  [AUTH_SHELL.TEMPLATE_TWO_COLUMN_RTL]: SessionRTLTemplate,
  [AUTH_SHELL.TEMPLATE_INSET]: SessionInsetTemplate
};
