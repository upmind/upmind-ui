// -----------------------------------------------------------------------------
/**
 * @module modules/product/shell
 * @description The product page templates, keyed by the template the organism hands the page.
 */

import { resolveTemplate } from "@upmind-automation/foundation";
import ProductEnclosedTemplate from "./templates/ProductEnclosed.template.vue";
import ProductFullTemplate from "./templates/ProductFull.template.vue";
import ProductInsetTemplate from "./templates/ProductInset.template.vue";
import ProductLTRTemplate from "./templates/ProductLTR.template.vue";
import ProductRTLTemplate from "./templates/ProductRTL.template.vue";
import { PRODUCT_TEMPLATE } from "./types";
import type { Component } from "vue";

export const PRODUCT_TEMPLATES: Record<PRODUCT_TEMPLATE, Component> = {
  [PRODUCT_TEMPLATE.FULL]: ProductFullTemplate,
  [PRODUCT_TEMPLATE.TWO_COLUMN_LTR]: ProductLTRTemplate,
  [PRODUCT_TEMPLATE.TWO_COLUMN_RTL]: ProductRTLTemplate,
  [PRODUCT_TEMPLATE.ENCLOSED]: ProductEnclosedTemplate,
  [PRODUCT_TEMPLATE.INSET]: ProductInsetTemplate
};

export const productTemplate = resolveTemplate(
  PRODUCT_TEMPLATES,
  PRODUCT_TEMPLATE.TWO_COLUMN_RTL
);
