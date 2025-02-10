import type { ButtonProps } from "@upmind-automation/ui";
import type { Component, HtmlHTMLAttributes } from "vue";
// ---
export interface PaymentDetailsProps {
  cardComponent?: Component | "div";
  class?: HtmlHTMLAttributes["class"];
  color?: ButtonProps["color"];
}

export interface CheckoutProps {
  cardComponent?: Component | "div";
  contentSectionComponent?: Component | "div";
  color?: ButtonProps["color"];
}

export interface BillingDetailsProps {
  i18nKey?: string;
  modelValue: any;
  color?: ButtonProps["color"];
  noActions?: boolean;
}
