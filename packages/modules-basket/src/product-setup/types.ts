// -----------------------------------------------------------------------------
/**
 * @module product-setup/types
 * @description Type definitions for product-setup components.
 */

import type { Component } from "vue";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

// -----------------------------------------------------------------------------

export enum PRODUCT_SETUP_TEMPLATE {
  FULL = "full",
  TWO_COLUMN_LTR = "two-column-ltr",
  TWO_COLUMN_RTL = "two-column-rtl",
  ENCLOSED = "enclosed"
}

/** The host's page templates, one per `PRODUCT_SETUP_TEMPLATE`. */
export type ProductSetupTemplates = Record<PRODUCT_SETUP_TEMPLATE, Component>;

export type ProductSetupProps = {
  template?: PRODUCT_SETUP_TEMPLATE;
  basketRoute?: RouteLocationAsRelativeGeneric;
  hideSlots?: string[];
};

export type ProductSetupFormProps = {
  bpid: string;
};
