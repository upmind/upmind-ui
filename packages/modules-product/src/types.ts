import type { StorefrontRoute } from "@upmind-automation/foundation";
import type { UseMetaResult } from "@upmind-automation/headless";
import type { HTMLAttributes } from "vue";
import type { RouteLocationAsRelativeGeneric } from "vue-router";
// -----------------------------------------------------------------------------

export type ConfigureProps = {
  storefrontRoute: StorefrontRoute;
  catalogueRoute?: RouteLocationAsRelativeGeneric;
  hideSlots?: string[];
  hideTerms?: boolean;
};

export type ConfigProps = {
  as?: "form" | "fieldset";
  /** Resolve whenever the form validates, for hosts that save inline. */
  autosave?: boolean;
  /** Fields that resolve on change, without waiting for the form to validate. */
  resolveFields?: string[];
  disabled?: boolean;
  required?: boolean;
  hideTerms?: boolean;
  touched?: boolean;
  noFooter?: boolean;
  class?: HTMLAttributes["class"];
  meta: UseMetaResult;
};

export type Item = {
  title?: string;
  subtitle?: string;
  imageSrc?: string;
  additionalCost?: string;
  additionalDetails?: Array<{
    category: string;
    name?: string;
    invalid?: boolean;
  }>;
};
