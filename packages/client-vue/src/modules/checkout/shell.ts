// -----------------------------------------------------------------------------
/**
 * @module modules/checkout/shell
 * @description The checkout page templates this package hands `@upmind-automation/basket`.
 */

import { CHECKOUT_TEMPLATE } from "@upmind-automation/basket";
import CheckoutEnclosedTemplate from "./templates/CheckoutEnclosed.template.vue";
import CheckoutFullTemplate from "./templates/CheckoutFull.template.vue";
import CheckoutInsetTemplate from "./templates/CheckoutInset.template.vue";
import CheckoutLTRTemplate from "./templates/CheckoutLTR.template.vue";
import CheckoutRTLTemplate from "./templates/CheckoutRTL.template.vue";
import type { CheckoutTemplates } from "@upmind-automation/basket";

export const CHECKOUT_TEMPLATES: CheckoutTemplates = {
  [CHECKOUT_TEMPLATE.FULL]: CheckoutFullTemplate,
  [CHECKOUT_TEMPLATE.TWO_COLUMN_LTR]: CheckoutLTRTemplate,
  [CHECKOUT_TEMPLATE.TWO_COLUMN_RTL]: CheckoutRTLTemplate,
  [CHECKOUT_TEMPLATE.ENCLOSED]: CheckoutEnclosedTemplate,
  [CHECKOUT_TEMPLATE.INSET]: CheckoutInsetTemplate
};
