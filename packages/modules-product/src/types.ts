import type { StorefrontRoute } from "@upmind-automation/foundation";
import type { UseMetaResult } from "@upmind-automation/headless";
import type { Component, HTMLAttributes } from "vue";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

/** The host's page templates, one per `PRODUCT_TEMPLATE`. */
export type ProductTemplates = Record<PRODUCT_TEMPLATE, Component>;

export type ConfigureProps = {
  storefrontRoute: StorefrontRoute;
  catalogueRoute?: RouteLocationAsRelativeGeneric;
  template?: PRODUCT_TEMPLATE;
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

export enum PRODUCT_TEMPLATE {
  FULL = "full",
  TWO_COLUMN_LTR = "two-column-ltr",
  TWO_COLUMN_RTL = "two-column-rtl",
  ENCLOSED = "enclosed",
  INSET = "inset"
}
