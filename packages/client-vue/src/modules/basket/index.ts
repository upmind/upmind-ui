import { defineAsyncComponent } from "vue";

// -----------------------------------------------------------------------------

// --- Export Views
// NB: for views that are used in routes, we need to use defineAsyncComponent
// to avoid circular dependencies. and to be able to lazy load them.

export const UpmBasketView = defineAsyncComponent(() => import("./Basket.vue"));

// --- Export Components

export const UpmCurrency = defineAsyncComponent(
  () => import("./components/CurrencySwitcher.vue")
);

// --- Export Types
