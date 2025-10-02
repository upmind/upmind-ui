import type { ButtonProps } from "@upmind-automation/upmind-ui";
import type { Component, HtmlHTMLAttributes } from "vue";
// ---
export interface PaymentDetailsProps {
  as?: Component | "div";
  class?: HtmlHTMLAttributes["class"];
  color?: ButtonProps["color"];
}

export interface CheckoutProps {
  as?: Component | "div";
  contentSectionComponent?: Component | "div";
  color?: ButtonProps["color"];
}

export interface BillingProps {
  modelValue: any;
  color?: ButtonProps["color"];
  noActions?: boolean;
}

export interface PaymentGatewayProps {
  variant?: string;
  color?: ButtonProps["color"];
}
