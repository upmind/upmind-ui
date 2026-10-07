// -----------------------------------------------------------------------------
/**
 * @module modules/order/shell
 * @description The five order page templates this app hands `@upmind-automation/invoice`.
 */

import { resolveTemplate } from "@upmind-automation/foundation";
import OrderEnclosedTemplate from "./templates/OrderEnclosed.template.vue";
import OrderFullTemplate from "./templates/OrderFull.template.vue";
import OrderInsetTemplate from "./templates/OrderInset.template.vue";
import OrderLTRTemplate from "./templates/OrderLTR.template.vue";
import OrderRTLTemplate from "./templates/OrderRTL.template.vue";
import { ORDER_TEMPLATE } from "./types";
import type { Component } from "vue";

export const ORDER_TEMPLATES: Record<ORDER_TEMPLATE, Component> = {
  [ORDER_TEMPLATE.FULL]: OrderFullTemplate,
  [ORDER_TEMPLATE.TWO_COLUMN_LTR]: OrderLTRTemplate,
  [ORDER_TEMPLATE.TWO_COLUMN_RTL]: OrderRTLTemplate,
  [ORDER_TEMPLATE.ENCLOSED]: OrderEnclosedTemplate,
  [ORDER_TEMPLATE.INSET]: OrderInsetTemplate
};

export const orderTemplate = resolveTemplate(
  ORDER_TEMPLATES,
  ORDER_TEMPLATE.TWO_COLUMN_RTL
);
