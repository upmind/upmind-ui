// -----------------------------------------------------------------------------

// --- Export Views
// NB: for views that are used in routes, we need to use defineAsyncComponent
// to avoid circular dependencies. and to be able to lazy load them.

export const UpmProductAddView = import("./Add.vue");

export const UpmProductEditView = import("./Edit.vue");

export const UpmProductNotFoundView = import("./NotFound.vue");

export const UpmProductRequiresActionView = import("./RequiresAction.vue");

export const UpmProductConfigView = import("./Config.vue");

export const UpmProductRecommendationsView = import("./Recommendations.vue");

// --- Export Components
export { default as UpmProductConfig } from "./components/config/Config.vue";
export { default as UpmProductConfigForm } from "./components/config/ConfigForm.vue";
export { default as UpmTermsConfigSelect } from "./components/terms/TermsConfigSelect.vue";
export { default as UpmTermCard } from "./components/terms/TermCard.vue";
export { default as UpmConfigSkeleton } from "./components/ConfigSkeleton.vue";
export { default as UpmSubproductCardPricing } from "./components/subproduct/SubproductCardPricing.vue";

// --- Export Types
