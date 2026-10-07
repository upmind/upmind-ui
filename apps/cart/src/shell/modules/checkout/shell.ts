// -----------------------------------------------------------------------------
/**
 * @module modules/checkout/shell
 * @description The checkout page templates this app hands `@upmind-automation/basket`.
 */

import { resolveTemplate } from "@upmind-automation/foundation";
import CheckoutEnclosedTemplate from "./templates/CheckoutEnclosed.template.vue";
import CheckoutFullTemplate from "./templates/CheckoutFull.template.vue";
import CheckoutInsetTemplate from "./templates/CheckoutInset.template.vue";
import CheckoutLTRTemplate from "./templates/CheckoutLTR.template.vue";
import CheckoutRTLTemplate from "./templates/CheckoutRTL.template.vue";
import { CHECKOUT_TEMPLATE } from "./types";
import type { Component } from "vue";

export const CHECKOUT_TEMPLATES: Record<CHECKOUT_TEMPLATE, Component> = {
  [CHECKOUT_TEMPLATE.FULL]: CheckoutFullTemplate,
  [CHECKOUT_TEMPLATE.TWO_COLUMN_LTR]: CheckoutLTRTemplate,
  [CHECKOUT_TEMPLATE.TWO_COLUMN_RTL]: CheckoutRTLTemplate,
  [CHECKOUT_TEMPLATE.ENCLOSED]: CheckoutEnclosedTemplate,
  [CHECKOUT_TEMPLATE.INSET]: CheckoutInsetTemplate
};

export const checkoutTemplate = resolveTemplate(
  CHECKOUT_TEMPLATES,
  CHECKOUT_TEMPLATE.TWO_COLUMN_LTR
);
