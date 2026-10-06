// -----------------------------------------------------------------------------
/**
 * @module basket
 * @description The in-flight order: basket, basket product, billing, checkout and product setup.
 */

// --- Export Views
export { default as UpmBasket } from "./components/Basket.vue";
export { default as UpmBasketUnavailable } from "./components/BasketUnavailable.vue";
export { default as UpmCurrency } from "./components/CurrencySwitcher.vue";
export { default as UpmCurrencySelect } from "./components/CurrencySelect.vue";
export { default as UpmBasketSummary } from "./components/Summary.vue";
export { default as UpmBasketProductEdit } from "./basket-product/Edit.vue";
export { default as UpmBasketProductCards } from "./basket-product/components/card/BasketProductCards.vue";
export { default as UpmBilling } from "./billing/Billing.vue";
export { default as UpmBillingForm } from "./billing/components/BillingForm.vue";
export { default as UpmCheckout } from "./checkout/Checkout.vue";
export { default as UpmProductSetup } from "./product-setup/ProductSetup.vue";

// --- Export the parts a host renders directly
export { default as UpmGuestCheckoutOffer } from "./checkout/components/GuestCheckoutOffer.vue";
export { default as UpmCheckoutPricing } from "./checkout/components/CheckoutPricing.vue";

// --- Export Types
export type { BillingFormProps, BillingProps } from "./billing/types";

export type {
  CheckoutBillingProps,
  CheckoutContentProps,
  CheckoutPricingProps,
  CheckoutProductSetupProps,
  GuestEmailProps
} from "./checkout/types";

export type {
  ProductSetupFormProps,
  ProductSetupProps
} from "./product-setup/types";
