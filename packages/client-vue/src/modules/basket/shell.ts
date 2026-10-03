// -----------------------------------------------------------------------------
/**
 * @module modules/basket/shell
 * @description The basket page templates this package hands `@upmind-automation/basket`.
 */

import { BASKET_TEMPLATE } from "@upmind-automation/basket";
import BasketEnclosedTemplate from "./templates/BasketEnclosed.template.vue";
import BasketFullTemplate from "./templates/BasketFull.template.vue";
import BasketInsetTemplate from "./templates/BasketInset.template.vue";
import BasketLTRTemplate from "./templates/BasketLTR.template.vue";
import BasketRTLTemplate from "./templates/BasketRTL.template.vue";
import type { BasketTemplates } from "@upmind-automation/basket";

export const BASKET_TEMPLATES: BasketTemplates = {
  [BASKET_TEMPLATE.FULL]: BasketFullTemplate,
  [BASKET_TEMPLATE.TWO_COLUMN_LTR]: BasketLTRTemplate,
  [BASKET_TEMPLATE.TWO_COLUMN_RTL]: BasketRTLTemplate,
  [BASKET_TEMPLATE.ENCLOSED]: BasketEnclosedTemplate,
  [BASKET_TEMPLATE.INSET]: BasketInsetTemplate
};
