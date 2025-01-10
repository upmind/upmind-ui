// --- expose our package exports

export * from "@upmind-automation/headless-vue";

export { default as UpmApp } from "./components/App.vue";

// --- expose our modules & components
export { default as UpmFeedback } from "./components/feedback/Feedback.vue";
// ---
export { default as UpmSession } from "./components/session/Session.vue";
export { default as UpmSessionLoginPopover } from "./components/session/LoginPopover.vue";
export { default as UpmSessionDetailsDropdown } from "./components/session/DetailsDropdown.vue";
export { default as UpmAuth } from "./components/session/Auth.vue";
export { default as UpmProfile } from "./components/session/Profile.vue";
export { default as UpmSessionExpired } from "./components/session/Expired.vue";
// ---
export { default as UpmClientListings } from "./components/client/Listings.vue";
export { default as UpmCurrency } from "./components/basket/CurrencySwitcher.vue";
// ---
export { default as UpmProductConfig } from "./components/product/Config.vue";
export { default as UpmProductNotFound } from "./components/product/NotFound.vue";
export * from "./components/renderers";
// ---
export { default as UpmBasketProducts } from "./components/basket/ItemListings.vue";
export { default as UpmBasketSummary } from "./components/basket/Summary.vue";
export { default as UpmBasketDetails } from "./components/basket/Details.vue";
export { default as UpmBasketProcessing } from "./components/basket/Procesing.vue";
export { default as UpmBasketEmpty } from "./components/basket/Empty.vue";
export { default as UpmBasketLoading } from "./components/basket/Loading.vue";
export { default as UpmSummary } from "./components/basket/Summary.vue";
export { default as UpmBasketProduct } from "./components/basket/product/BasketProduct.vue";
export { default as UpmBasketProductCards } from "./components/basket/product/BasketProductCards.vue";
export { default as UpmTermsConfigSelect } from "./components/product/TermsConfigSelect.vue";
export { default as UpmTermCard } from "./components/product/TermCard.vue";
// ---
export { default as UpmTermsDescription } from "./components/basket/product/components/TermsDescription.vue";
// ---
export { default as UpmRecommendations } from "./components/recommendation/Recommendations.vue";
// ---
export { default as UpmCheckout } from "./components/checkout/Checkout.vue";
export { default as UpmPaymentDetails } from "./components/checkout/PaymentDetails.vue";
export { default as UpmPaymentNotRequired } from "./components/checkout/PaymentNotRequired.vue";
export { default as UpmBillingDetails } from "./components/checkout/BillingDetails.vue";
// ---
export { default as UpmCard } from "./components/content/Card.vue";
export { default as UpmContent } from "./components/content/Content.vue";
export { default as UpmContentSection } from "./components/content/ContentSection.vue";
// ---
export { default as UpmBack } from "./components/navigation/Back.vue";
// ---
export { default as UpmOrderConfirmation } from "./components/order/Confirmation.vue";
// ---
export { default as UpmDomain } from "./components/domain/Domain.vue";
