// -----------------------------------------------------------------------------
/**
 * @module modules/basket-product/shell
 * @description The basket-product page templates this app hands `@upmind-automation/basket`.
 */

import { resolveTemplate } from "@upmind-automation/foundation";
import BasketProductEnclosedTemplate from "./templates/BasketProductEnclosed.template.vue";
import BasketProductFullTemplate from "./templates/BasketProductFull.template.vue";
import BasketProductInsetTemplate from "./templates/BasketProductInset.template.vue";
import BasketProductLTRTemplate from "./templates/BasketProductLTR.template.vue";
import BasketProductRTLTemplate from "./templates/BasketProductRTL.template.vue";
import { BASKET_PRODUCT_TEMPLATE } from "./types";
import type { Component } from "vue";

export const BASKET_PRODUCT_TEMPLATES: Record<
  BASKET_PRODUCT_TEMPLATE,
  Component
> = {
  [BASKET_PRODUCT_TEMPLATE.FULL]: BasketProductFullTemplate,
  [BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_LTR]: BasketProductLTRTemplate,
  [BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_RTL]: BasketProductRTLTemplate,
  [BASKET_PRODUCT_TEMPLATE.ENCLOSED]: BasketProductEnclosedTemplate,
  [BASKET_PRODUCT_TEMPLATE.INSET]: BasketProductInsetTemplate
};

export const basketProductTemplate = resolveTemplate(
  BASKET_PRODUCT_TEMPLATES,
  BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_RTL
);
