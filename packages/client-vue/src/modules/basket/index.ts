// -----------------------------------------------------------------------------

import { defineAsyncComponent } from "vue";

// --- Export Views
// NB: for views that are used in routes, we need to use defineAsyncComponent
// to avoid circular dependencies. and to be able to lazy load them.

export const UpmBasket = defineAsyncComponent(() => import("./Basket.vue"));

// --- Export Components
export const UpmBasketAction = defineAsyncComponent(
  () => import("./components/BasketAction.vue")
);
export const UpmCurrency = defineAsyncComponent(
  () => import("./components/CurrencySwitcher.vue")
);
export const UpmBasketSummary = defineAsyncComponent(
  () => import("./components/Summary.vue")
);
// --- Export Types
export { BASKET_TEMPLATE } from "./types";
