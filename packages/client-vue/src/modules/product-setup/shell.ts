// -----------------------------------------------------------------------------
/**
 * @module modules/product-setup/shell
 * @description The product-setup page templates this package hands `@upmind-automation/basket`.
 */

import { PRODUCT_SETUP_TEMPLATE } from "@upmind-automation/basket";
import ProductSetupEnclosedTemplate from "./templates/ProductSetupEnclosed.template.vue";
import ProductSetupFullTemplate from "./templates/ProductSetupFull.template.vue";
import ProductSetupLTRTemplate from "./templates/ProductSetupLTR.template.vue";
import ProductSetupRTLTemplate from "./templates/ProductSetupRTL.template.vue";
import type { ProductSetupTemplates } from "@upmind-automation/basket";

export const PRODUCT_SETUP_TEMPLATES: ProductSetupTemplates = {
  [PRODUCT_SETUP_TEMPLATE.FULL]: ProductSetupFullTemplate,
  [PRODUCT_SETUP_TEMPLATE.TWO_COLUMN_LTR]: ProductSetupLTRTemplate,
  [PRODUCT_SETUP_TEMPLATE.TWO_COLUMN_RTL]: ProductSetupRTLTemplate,
  [PRODUCT_SETUP_TEMPLATE.ENCLOSED]: ProductSetupEnclosedTemplate
};
