import type { ButtonProps } from "@upmind-automation/upmind-ui";
import type { Component, HtmlHTMLAttributes } from "vue";
// ---
export interface PaymentDetailsProps {
  as?: Component | "div";
  class?: HtmlHTMLAttributes["class"];
}

export interface CheckoutProps {
  as?: Component | "div";
  contentSectionComponent?: Component | "div";
}

export interface BillingProps {
  modelValue: any;
  noActions?: boolean;
}

export interface PaymentGatewayProps {
  variant?: ButtonProps["variant"];
  color?: ButtonProps["color"];
}

export enum CHECKOUT_TEMPLATE {
  FULL = "full",
  TWO_COLUMN_LTR = "two-column-LTR",
  TWO_COLUMN_RTL = "two-column-RTL"
}
