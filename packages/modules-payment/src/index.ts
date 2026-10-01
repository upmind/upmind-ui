// -----------------------------------------------------------------------------
/**
 * @module payment
 * @description The make-payment package.
 */
import { registerFormRenderers } from "@upmind-automation/foundation";
import { paymentRenderers } from "./renderers";

registerFormRenderers(paymentRenderers);

// --- Export Views
export { default as UpmPayment } from "./components/Payment.vue";

// --- Export Components
export { default as UpmPaymentDetails } from "./components/PaymentDetails.vue";
export { default as UpmPaymentProcessing } from "./components/PaymentProcessing.vue";

// --- Export Renderers
export { paymentRenderers } from "./renderers";

// --- Export Types
export * from "./types";
