// -----------------------------------------------------------------------------
/**
 * @module modules/basket/shell
 * @description The basket page templates this app hands `@upmind-automation/basket`.
 */

import { resolveTemplate } from "@upmind-automation/foundation";
import BasketEnclosedTemplate from "./templates/BasketEnclosed.template.vue";
import BasketFullTemplate from "./templates/BasketFull.template.vue";
import BasketInsetTemplate from "./templates/BasketInset.template.vue";
import BasketLTRTemplate from "./templates/BasketLTR.template.vue";
import BasketRTLTemplate from "./templates/BasketRTL.template.vue";
import { BASKET_TEMPLATE } from "./types";
import type { Component } from "vue";

export const BASKET_TEMPLATES: Record<BASKET_TEMPLATE, Component> = {
  [BASKET_TEMPLATE.FULL]: BasketFullTemplate,
  [BASKET_TEMPLATE.TWO_COLUMN_LTR]: BasketLTRTemplate,
  [BASKET_TEMPLATE.TWO_COLUMN_RTL]: BasketRTLTemplate,
  [BASKET_TEMPLATE.ENCLOSED]: BasketEnclosedTemplate,
  [BASKET_TEMPLATE.INSET]: BasketInsetTemplate
};

export const basketTemplate = resolveTemplate(
  BASKET_TEMPLATES,
  BASKET_TEMPLATE.TWO_COLUMN_LTR
);
