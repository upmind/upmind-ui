import type { Component } from "vue";
// ---
export interface PaymentDetailsProps {
  cardComponent?: Component | "div";
  class?: string;
}

export interface CheckoutProps {
  cardComponent?: Component | "div";
  contentSectionComponent?: Component | "div";
}
