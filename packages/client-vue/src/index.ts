// --- expose our package exports

export * from "@upmind/flow-vue";
export * from "@upmind/upwind";

// --- expose our modules & components
export { default as UpmFeedback } from "./components/feedback/Feedback.vue";
// ---
export { default as UpmSession } from "./components/session/Session.vue";
export { default as UpmAuth } from "./components/session/Auth.vue";
export { default as UpmProfile } from "./components/session/Profile.vue";
// ---
export { default as UpmClientListings } from "./components/client/Listings.vue";
export { default as UpmClientBasket } from "./components/client/Basket.vue";
export { default as UpmCurrency } from "./components/basket/CurrencySwitcher.vue";
// ---
export { default as UpmBasketSummary } from "./components/basket/Summary.vue";
export { default as UpwBasketDetails } from "./components/basket/Details.vue";
