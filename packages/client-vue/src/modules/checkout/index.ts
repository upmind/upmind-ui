import { defineAsyncComponent } from "vue";

// -----------------------------------------------------------------------------

// --- Export Views
// NB: for views that are used in routes, we need to use defineAsyncComponent
// to avoid circular dependencies. and to be able to lazy load them.

export const UpmCheckoutView = defineAsyncComponent(
  () => import("./Checkout.vue")
);

// --- Export Components

// --- Export Types
