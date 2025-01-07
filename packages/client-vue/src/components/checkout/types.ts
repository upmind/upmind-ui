import type { Component } from "vue";
// ---
export interface PaymentDetailsProps {
  cardComponent?: Component | "div";
  class?: string;
  color?: string;
}

export interface CheckoutProps {
  cardComponent?: Component | "div";
  contentSectionComponent?: Component | "div";
  color?: string;
}
