// -----------------------------------------------------------------------------

import { defineAsyncComponent } from "vue";

// --- Export Views
// NB: for views that are used in routes, we need to use defineAsyncComponent
// to avoid circular dependencies. and to be able to lazy load them.

export const UpmDomain = defineAsyncComponent(() => import("./Domain.vue"));
export const UpmDac = defineAsyncComponent(() => import("./Dac.vue"));

// --- Export Components

// --- Export Types
export { DOMAIN_TEMPLATE } from "./types";
