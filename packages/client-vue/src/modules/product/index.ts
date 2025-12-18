// -----------------------------------------------------------------------------

import { defineAsyncComponent, type Component } from "vue";

// --- Export Views
// NB: for views that are used in routes, we need to use defineAsyncComponent
// to avoid circular dependencies. and to be able to lazy load them.

export const UpmProductConfigure = defineAsyncComponent(
  () => import("./Configure.vue")
);

export const UpmProductNotFound = defineAsyncComponent(
  () => import("./NotFound.vue")
);
export const UpmProductRequiresAction = defineAsyncComponent(
  () => import("./RequiresAction.vue")
);

export const UpmProductRecommendations = defineAsyncComponent(
  () => import("./Recommendations.vue")
);

export const UpmProductConfig = defineAsyncComponent(
  () => import("./components/config/Config.vue")
);
export const UpmProductConfigForm = defineAsyncComponent(
  () => import("./components/config/ConfigForm.vue")
);
export const UpmTermsConfigSelect: Component = defineAsyncComponent(
  () => import("./components/terms/TermsConfigSelect.vue")
);
export const UpmTermCard = defineAsyncComponent(
  () => import("./components/terms/TermCard.vue")
);
export const UpmConfigSkeleton = defineAsyncComponent(
  () => import("./components/ConfigSkeleton.vue")
);
export const UpmSubproductCard = defineAsyncComponent(
  () => import("./components/subproduct/SubproductCard.vue")
);
export const UpmSubproductCardPricing = defineAsyncComponent(
  () => import("./components/subproduct/SubproductCardPricing.vue")
);

// --- Export Types
export { PRODUCT_TEMPLATE } from "./types";
