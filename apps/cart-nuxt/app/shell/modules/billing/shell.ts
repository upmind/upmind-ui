// -----------------------------------------------------------------------------
/**
 * @module modules/billing/shell
 * @description The billing page templates this app hands `@upmind-automation/basket`.
 */

import { BILLING_TEMPLATE } from "@upmind-automation/basket";
import BillingEnclosedTemplate from "./templates/BillingEnclosed.template.vue";
import BillingFullTemplate from "./templates/BillingFull.template.vue";
import BillingInsetTemplate from "./templates/BillingInset.template.vue";
import BillingLTRTemplate from "./templates/BillingLTR.template.vue";
import BillingRTLTemplate from "./templates/BillingRTL.template.vue";
import type { BillingTemplates } from "@upmind-automation/basket";

export const BILLING_TEMPLATES: BillingTemplates = {
  [BILLING_TEMPLATE.FULL]: BillingFullTemplate,
  [BILLING_TEMPLATE.TWO_COLUMN_LTR]: BillingLTRTemplate,
  [BILLING_TEMPLATE.TWO_COLUMN_RTL]: BillingRTLTemplate,
  [BILLING_TEMPLATE.ENCLOSED]: BillingEnclosedTemplate,
  [BILLING_TEMPLATE.INSET]: BillingInsetTemplate
};
