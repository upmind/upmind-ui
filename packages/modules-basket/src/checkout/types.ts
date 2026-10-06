import type { RouteLocationAsRelativeGeneric } from "vue-router";

export interface CheckoutContentProps {
  showCheckout: boolean;
  editRoute: RouteLocationAsRelativeGeneric;
  billingRoute: RouteLocationAsRelativeGeneric;
  fieldsRoute?: RouteLocationAsRelativeGeneric;
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
