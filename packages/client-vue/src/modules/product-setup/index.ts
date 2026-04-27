// -----------------------------------------------------------------------------
/**
 * @module product-setup
 * @description Product Setup module for fixing invalid/deferred products before checkout.
 */

// --- Export Views
export { default as UpmProductSetup } from "./ProductSetup.vue";

// --- Export Components
export { default as UpmSetupProgress } from "./components/SetupProgress.vue";
export { default as UpmApplyToOthers } from "./components/ApplyToOthers.vue";

// --- Export Types
export { PRODUCT_SETUP_TEMPLATE } from "./types";
export type { ProductSetupProps } from "./types";
