// -----------------------------------------------------------------------------
/**
 * @module modules/order/shell
 * @description The five order page templates this package hands `@upmind-automation/invoice`.
 */

import { ORDER_TEMPLATE } from "@upmind-automation/invoice";
import OrderEnclosedTemplate from "./templates/OrderEnclosed.template.vue";
import OrderFullTemplate from "./templates/OrderFull.template.vue";
import OrderInsetTemplate from "./templates/OrderInset.template.vue";
import OrderLTRTemplate from "./templates/OrderLTR.template.vue";
import OrderRTLTemplate from "./templates/OrderRTL.template.vue";
import type { OrderTemplates } from "@upmind-automation/invoice";

export const ORDER_TEMPLATES: OrderTemplates = {
  [ORDER_TEMPLATE.FULL]: OrderFullTemplate,
  [ORDER_TEMPLATE.TWO_COLUMN_LTR]: OrderLTRTemplate,
  [ORDER_TEMPLATE.TWO_COLUMN_RTL]: OrderRTLTemplate,
  [ORDER_TEMPLATE.ENCLOSED]: OrderEnclosedTemplate,
  [ORDER_TEMPLATE.INSET]: OrderInsetTemplate
};
