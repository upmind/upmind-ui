import type { Component } from "vue";
import type { BillingModel } from "@upmind-automation/headless";

export interface BillingProps {
  modelValue?: BillingModel;
  as?: Component | "div";
}
