// -----------------------------------------------------------------------------
/**
 * @module modules/product/shell
 * @description The product page templates, keyed by the template the organism hands the page.
 */

import { PRODUCT_TEMPLATE } from "@upmind-automation/product";
import ProductEnclosedTemplate from "./templates/ProductEnclosed.template.vue";
import ProductFullTemplate from "./templates/ProductFull.template.vue";
import ProductInsetTemplate from "./templates/ProductInset.template.vue";
import ProductLTRTemplate from "./templates/ProductLTR.template.vue";
import ProductRTLTemplate from "./templates/ProductRTL.template.vue";
import type { ProductTemplates } from "@upmind-automation/product";

export const PRODUCT_TEMPLATES: ProductTemplates = {
  [PRODUCT_TEMPLATE.FULL]: ProductFullTemplate,
  [PRODUCT_TEMPLATE.TWO_COLUMN_LTR]: ProductLTRTemplate,
  [PRODUCT_TEMPLATE.TWO_COLUMN_RTL]: ProductRTLTemplate,
  [PRODUCT_TEMPLATE.ENCLOSED]: ProductEnclosedTemplate,
  [PRODUCT_TEMPLATE.INSET]: ProductInsetTemplate
};
