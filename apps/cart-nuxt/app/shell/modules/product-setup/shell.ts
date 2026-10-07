// -----------------------------------------------------------------------------
/**
 * @module modules/product-setup/shell
 * @description The product-setup page templates this app hands `@upmind-automation/basket`.
 */

import { resolveTemplate } from "@upmind-automation/foundation";
import ProductSetupEnclosedTemplate from "./templates/ProductSetupEnclosed.template.vue";
import ProductSetupFullTemplate from "./templates/ProductSetupFull.template.vue";
import ProductSetupLTRTemplate from "./templates/ProductSetupLTR.template.vue";
import ProductSetupRTLTemplate from "./templates/ProductSetupRTL.template.vue";
import { PRODUCT_SETUP_TEMPLATE } from "./types";
import type { Component } from "vue";

export const PRODUCT_SETUP_TEMPLATES: Record<
  PRODUCT_SETUP_TEMPLATE,
  Component
> = {
  [PRODUCT_SETUP_TEMPLATE.FULL]: ProductSetupFullTemplate,
  [PRODUCT_SETUP_TEMPLATE.TWO_COLUMN_LTR]: ProductSetupLTRTemplate,
  [PRODUCT_SETUP_TEMPLATE.TWO_COLUMN_RTL]: ProductSetupRTLTemplate,
  [PRODUCT_SETUP_TEMPLATE.ENCLOSED]: ProductSetupEnclosedTemplate
};

export const productSetupTemplate = resolveTemplate(
  PRODUCT_SETUP_TEMPLATES,
  PRODUCT_SETUP_TEMPLATE.TWO_COLUMN_RTL
);
