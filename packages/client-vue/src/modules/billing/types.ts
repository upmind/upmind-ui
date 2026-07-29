import type { Component } from "vue";
import type { RouteLocationAsRelativeGeneric } from "vue-router";
import type { BillingModel } from "@upmind-automation/headless";

export enum BILLING_TEMPLATE {
  FULL = "full",
  TWO_COLUMN_LTR = "two-column-ltr",
  TWO_COLUMN_RTL = "two-column-rtl",
  ENCLOSED = "enclosed",
  INSET = "inset"
}

export interface BillingFormProps {
  touched?: boolean;
  modelValue?: BillingModel;
  as?: Component | "div";
  autoUpdate?: boolean;
  billingRoute?: RouteLocationAsRelativeGeneric;
  expand?: boolean;
  inline?: boolean;
  card?: boolean;
  /** Edit-in-place hosting (the checkout's inline billing section): manual
   * (non-autosave) state is an edit with its own Continue, commits on every
   * form resolve, and only resolves once billing is complete. Off = the
   * stepped standalone-page choreography. */
  inlineEditing?: boolean;
}

export interface BillingProps {
  template?: BILLING_TEMPLATE;
  hideSlots?: string[];
}

export interface BillingHeroProps {
  template?: BILLING_TEMPLATE;
}

export interface BillingSummarySkeletonProps {
  card?: boolean;
}
