import type { StorefrontRoute } from "@upmind-automation/foundation";
import type { Component } from "vue";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

export enum BASKET_PRODUCT_TEMPLATE {
  FULL = "full",
  TWO_COLUMN_LTR = "two-column-ltr",
  TWO_COLUMN_RTL = "two-column-rtl",
  ENCLOSED = "enclosed",
  INSET = "inset"
}

/** The host's page templates, one per `BASKET_PRODUCT_TEMPLATE`. */
export type BasketProductTemplates = Record<BASKET_PRODUCT_TEMPLATE, Component>;

export type BasketProductEditProps = {
  template?: BASKET_PRODUCT_TEMPLATE;
  storefrontRoute: StorefrontRoute;
  catalogueRoute?: RouteLocationAsRelativeGeneric;
  hideSlots?: string[];
  hideTerms?: boolean;
};
