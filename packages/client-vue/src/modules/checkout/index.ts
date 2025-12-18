// -----------------------------------------------------------------------------

import { defineAsyncComponent } from "vue";

// --- Export Views
// NB: for views that are used in routes, we need to use defineAsyncComponent
// to avoid circular dependencies. and to be able to lazy load them.

export const UpmCheckout = defineAsyncComponent(() => import("./Checkout.vue"));
export const UpmPaymentDetails = defineAsyncComponent(
  () => import("./components/PaymentDetails.vue")
);
export const UpmPaymentProcessing = defineAsyncComponent(
  () => import("./components/CheckoutProcessing.vue")
);

// --- Export Components

// --- Export Types
export * from "./types";
