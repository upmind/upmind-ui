// -----------------------------------------------------------------------------

// --- Export Views
// NB: for views that are used in routes, we need to use defineAsyncComponent
// to avoid circular dependencies. and to be able to lazy load them.

export const UpmBasketView = import("./Basket.vue");

// --- Export Components
export { default as UpmCurrency } from "./components/CurrencySwitcher.vue";
export { default as UpmPromotionBadge } from "./product/components/Promotion.vue";
export { default as UpmBasketProductCards } from "./product/BasketProductCards.vue";
export { default as UpmPromotion } from "./product/components/Promotion.vue";

// --- Export Types
