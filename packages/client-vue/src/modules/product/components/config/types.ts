// --- types
import type { HTMLAttributes } from "vue";
import type { UseMetaResult } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------

export type ConfigProps = {
  as?: string;
  disabled?: boolean;
  required?: boolean;
  hideTerms?: boolean;
  noFooter?: boolean;
  class?: HTMLAttributes["class"];
  meta: UseMetaResult;
};

export type ConfigFormProps = {
  disabled?: boolean;
  loading?: boolean;
  processing?: boolean;
  touched?: boolean;
  fields: any;
  modelValue: any;
  additionalErrors?: any[];
  label?: string;
};
