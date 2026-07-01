import type { StorefrontRoute } from "../../types";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

export enum BASKET_PRODUCT_TEMPLATE {
  FULL = "full",
  TWO_COLUMN_LTR = "two-column-ltr",
  TWO_COLUMN_RTL = "two-column-rtl",
  ENCLOSED = "enclosed"
}

export type BasketProductEditProps = {
  template?: BASKET_PRODUCT_TEMPLATE;
  storefrontRoute: StorefrontRoute;
  catalogueRoute?: RouteLocationAsRelativeGeneric;
  hideSlots?: string[];
  hideTerms?: boolean;
};
