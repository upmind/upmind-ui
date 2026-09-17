/**
 * @module portal/auth/shell
 * @description The page templates this app hands `@upmind-automation/auth`
 * through `foundation`'s shell socket. Amendment 1 change 3 keeps the page
 * app-owned, so all seven of the package's template names are drawn here, on
 * this app's own chrome. A name with no entry has no page, which is what the
 * package's missing-slot error reports.
 */

import { AUTH_SHELL } from "@upmind-automation/auth";
import PortalAuthCanvasCardTemplate from "./templates/PortalAuthCanvasCard.template.vue";
import PortalAuthEnclosedTemplate from "./templates/PortalAuthEnclosed.template.vue";
import PortalAuthInsetTemplate from "./templates/PortalAuthInset.template.vue";
import PortalAuthLTRTemplate from "./templates/PortalAuthLTR.template.vue";
import PortalAuthRTLTemplate from "./templates/PortalAuthRTL.template.vue";
import PortalAuthSplitTemplate from "./templates/PortalAuthSplit.template.vue";
import PortalAuthSurfaceBoxTemplate from "./templates/PortalAuthSurfaceBox.template.vue";
import type { ShellComponents } from "@upmind-automation/foundation";

export const PORTAL_AUTH_SHELL_COMPONENTS: ShellComponents = {
  [AUTH_SHELL.TEMPLATE_SPLIT]: PortalAuthSplitTemplate,
  [AUTH_SHELL.TEMPLATE_ENCLOSED]: PortalAuthEnclosedTemplate,
  [AUTH_SHELL.TEMPLATE_CANVAS_CARD]: PortalAuthCanvasCardTemplate,
  [AUTH_SHELL.TEMPLATE_SURFACE_BOX]: PortalAuthSurfaceBoxTemplate,
  [AUTH_SHELL.TEMPLATE_TWO_COLUMN_LTR]: PortalAuthLTRTemplate,
  [AUTH_SHELL.TEMPLATE_TWO_COLUMN_RTL]: PortalAuthRTLTemplate,
  [AUTH_SHELL.TEMPLATE_INSET]: PortalAuthInsetTemplate
};
