// -----------------------------------------------------------------------------

import { defineAsyncComponent } from "vue";

// --- Export Views
// NB: for views that are used in routes, we need to use defineAsyncComponent
// to avoid circular dependencies. and to be able to lazy load them.

export const Upm404 = defineAsyncComponent(() => import("./404.vue"));
export const UpmLoading = defineAsyncComponent(() => import("./Loading.vue"));
export const UpmError = defineAsyncComponent(() => import("./Error.vue"));
export const UpmEmpty = defineAsyncComponent(() => import("./Empty.vue"));
export const UpmRouteView = defineAsyncComponent(() => import("./View.vue"));

// --- Export Types
