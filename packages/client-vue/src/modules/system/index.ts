import { defineAsyncComponent } from "vue";

// -----------------------------------------------------------------------------

// --- Export Views
// NB: for views that are used in routes, we need to use defineAsyncComponent
// to avoid circular dependencies. and to be able to lazy load them.

export const Upm404View = defineAsyncComponent(() => import("./404.vue"));
export const UpmEmptyView = defineAsyncComponent(() => import("./Empty.vue"));
export const UpmLoadingView = defineAsyncComponent(
  () => import("./Loading.vue")
);

// --- Export Components

// --- Export Types
