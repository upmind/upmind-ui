import type { Component } from "vue";
import type { RouteLocationAsRelativeGeneric } from "vue-router";
import type { BillingModel } from "@upmind-automation/headless";

export enum BILLING_TEMPLATE {
  FULL = "full",
  TWO_COLUMN_LTR = "two-column-ltr",
  TWO_COLUMN_RTL = "two-column-rtl",
  ENCLOSED = "enclosed"
}

export interface BillingFormProps {
  touched?: boolean;
  modelValue?: BillingModel;
  as?: Component | "div";
  autoUpdate?: boolean;
  billingRoute?: RouteLocationAsRelativeGeneric;
  expand?: boolean;
  inline?: boolean;
}

export interface BillingProps {
  template?: BILLING_TEMPLATE;
  hideSlots?: string[];
}

export interface BillingHeroProps {
  template?: BILLING_TEMPLATE;
}
