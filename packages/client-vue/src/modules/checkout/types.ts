import type { RouteLocationAsRelativeGeneric } from "vue-router";

export enum CHECKOUT_TEMPLATE {
  FULL = "full",
  TWO_COLUMN_LTR = "two-column-ltr",
  TWO_COLUMN_RTL = "two-column-rtl",
  ENCLOSED = "enclosed",
  // The one-page checkout: every section (product config, auth, billing, setup,
  // payment) rendered inline on a single page.
  INSET = "inset"
}

export interface CheckoutContentProps {
  showCheckout: boolean;
  editRoute: RouteLocationAsRelativeGeneric;
  billingRoute: RouteLocationAsRelativeGeneric;
  fieldsRoute?: RouteLocationAsRelativeGeneric;
}

export interface CheckoutHeroProps {
  template?: CHECKOUT_TEMPLATE;
}

export interface CheckoutProductSetupProps {
  disabled?: boolean;
}

export interface CheckoutBillingProps {
  billingRoute: RouteLocationAsRelativeGeneric;
}

export interface CheckoutPricingProps {
  editRoute?: RouteLocationAsRelativeGeneric;
}

export interface GuestEmailProps {
  disabled?: boolean;
}
