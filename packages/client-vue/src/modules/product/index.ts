// -----------------------------------------------------------------------------

import type { Component } from "vue";

// --- Export Views
export { default as UpmProductConfigure } from "./Configure.vue";
export { default as UpmProductNotFound } from "./NotFound.vue";
export { default as UpmProductRecommendations } from "./Recommendations.vue";

// --- Export Components
export { default as UpmProductConfig } from "./components/Config.vue";
export { default as UpmTermsConfigSelect } from "./components/terms/TermsConfigSelect.vue";
export { default as UpmTermCard } from "./components/terms/TermCard.vue";
export { default as UpmConfigSkeleton } from "./components/ConfigSkeleton.vue";
export { default as UpmSubproductCard } from "./components/subproduct/SubproductCard.vue";
export { default as UpmSubproductCardPricing } from "./components/subproduct/SubproductCardPricing.vue";

// --- Export Types
export { PRODUCT_TEMPLATE } from "./types";
