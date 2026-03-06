import type { RouteLocationAsRelativeGeneric } from "vue-router";
import type { StorefrontRoute } from "../../types";

export type ConfigureProps = {
  storefrontRoute: StorefrontRoute;
  catalogueRoute?: RouteLocationAsRelativeGeneric;
  template?: PRODUCT_TEMPLATE;
  hideSlots?: string[];
  hideTerms?: boolean;
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
  ENCLOSED = "enclosed"
}
