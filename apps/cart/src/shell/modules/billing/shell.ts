// -----------------------------------------------------------------------------
/**
 * @module modules/billing/shell
 * @description The billing page templates this app hands `@upmind-automation/basket`.
 */

import { resolveTemplate } from "@upmind-automation/foundation";
import BillingEnclosedTemplate from "./templates/BillingEnclosed.template.vue";
import BillingFullTemplate from "./templates/BillingFull.template.vue";
import BillingInsetTemplate from "./templates/BillingInset.template.vue";
import BillingLTRTemplate from "./templates/BillingLTR.template.vue";
import BillingRTLTemplate from "./templates/BillingRTL.template.vue";
import { BILLING_TEMPLATE } from "./types";
import type { Component } from "vue";

export const BILLING_TEMPLATES: Record<BILLING_TEMPLATE, Component> = {
  [BILLING_TEMPLATE.FULL]: BillingFullTemplate,
  [BILLING_TEMPLATE.TWO_COLUMN_LTR]: BillingLTRTemplate,
  [BILLING_TEMPLATE.TWO_COLUMN_RTL]: BillingRTLTemplate,
  [BILLING_TEMPLATE.ENCLOSED]: BillingEnclosedTemplate,
  [BILLING_TEMPLATE.INSET]: BillingInsetTemplate
};

export const billingTemplate = resolveTemplate(
  BILLING_TEMPLATES,
  BILLING_TEMPLATE.TWO_COLUMN_RTL
);
