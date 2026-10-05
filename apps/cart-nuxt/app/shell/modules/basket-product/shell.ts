// -----------------------------------------------------------------------------
/**
 * @module modules/basket-product/shell
 * @description The basket-product page templates this app hands `@upmind-automation/basket`.
 */

import { BASKET_PRODUCT_TEMPLATE } from "@upmind-automation/basket";
import BasketProductEnclosedTemplate from "./templates/BasketProductEnclosed.template.vue";
import BasketProductFullTemplate from "./templates/BasketProductFull.template.vue";
import BasketProductInsetTemplate from "./templates/BasketProductInset.template.vue";
import BasketProductLTRTemplate from "./templates/BasketProductLTR.template.vue";
import BasketProductRTLTemplate from "./templates/BasketProductRTL.template.vue";
import type { BasketProductTemplates } from "@upmind-automation/basket";

export const BASKET_PRODUCT_TEMPLATES: BasketProductTemplates = {
  [BASKET_PRODUCT_TEMPLATE.FULL]: BasketProductFullTemplate,
  [BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_LTR]: BasketProductLTRTemplate,
  [BASKET_PRODUCT_TEMPLATE.TWO_COLUMN_RTL]: BasketProductRTLTemplate,
  [BASKET_PRODUCT_TEMPLATE.ENCLOSED]: BasketProductEnclosedTemplate,
  [BASKET_PRODUCT_TEMPLATE.INSET]: BasketProductInsetTemplate
};
