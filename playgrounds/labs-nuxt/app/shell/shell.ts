/**
 * @module shell/shell
 * @description The page templates this playground hands the `auth` and `invoice` packages.
 */

import { resolveTemplate } from "@upmind-automation/foundation";
import OrderEnclosedTemplate from "./modules/order/templates/OrderEnclosed.template.vue";
import OrderFullTemplate from "./modules/order/templates/OrderFull.template.vue";
import OrderInsetTemplate from "./modules/order/templates/OrderInset.template.vue";
import OrderLTRTemplate from "./modules/order/templates/OrderLTR.template.vue";
import OrderRTLTemplate from "./modules/order/templates/OrderRTL.template.vue";
import { ORDER_TEMPLATE } from "./modules/order/types";
import SessionCanvasCardTemplate from "./modules/session/templates/SessionCanvasCard.template.vue";
import SessionEnclosedTemplate from "./modules/session/templates/SessionEnclosed.template.vue";
import SessionInsetTemplate from "./modules/session/templates/SessionInset.template.vue";
import SessionLTRTemplate from "./modules/session/templates/SessionLTR.template.vue";
import SessionRTLTemplate from "./modules/session/templates/SessionRTL.template.vue";
import SessionSplitTemplate from "./modules/session/templates/SessionSplit.template.vue";
import SessionSurfaceBoxTemplate from "./modules/session/templates/SessionSurfaceBox.template.vue";
import { AUTH_TEMPLATE } from "./modules/session/types";
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

export const LABS_ORDER_TEMPLATES: Record<ORDER_TEMPLATE, Component> = {
  [ORDER_TEMPLATE.FULL]: OrderFullTemplate,
  [ORDER_TEMPLATE.TWO_COLUMN_LTR]: OrderLTRTemplate,
  [ORDER_TEMPLATE.TWO_COLUMN_RTL]: OrderRTLTemplate,
  [ORDER_TEMPLATE.ENCLOSED]: OrderEnclosedTemplate,
  [ORDER_TEMPLATE.INSET]: OrderInsetTemplate
};

export const sessionTemplate = resolveTemplate(
  SESSION_TEMPLATES,
  AUTH_TEMPLATE.TWO_COLUMN_LTR
);

export const orderTemplate = resolveTemplate(
  LABS_ORDER_TEMPLATES,
  ORDER_TEMPLATE.TWO_COLUMN_RTL
);
