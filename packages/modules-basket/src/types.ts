import type { Component } from "vue";

export enum BASKET_TEMPLATE {
  FULL = "full",
  TWO_COLUMN_LTR = "two-column-ltr",
  TWO_COLUMN_RTL = "two-column-rtl",
  ENCLOSED = "enclosed",
  INSET = "inset"
}

/** The host's page templates, one per `BASKET_TEMPLATE`. */
export type BasketTemplates = Record<BASKET_TEMPLATE, Component>;
