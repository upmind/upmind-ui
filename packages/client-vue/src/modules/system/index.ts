// -----------------------------------------------------------------------------
export * from "./i18n";

// --- Export Views
// NB: for views that are used in routes, we need to use defineAsyncComponent
// to avoid circular dependencies. and to be able to lazy load them.

export const Upm404View = import("./404.vue");
export const UpmErrorView = import("./Error.vue");
export const UpmEmptyView = import("./Empty.vue");
export const UpmLoadingView = import("./Loading.vue");

// --- Export Components
export { default as UpmLoading } from "./Loading.vue";
export { default as UpmError } from "./Error.vue";
export { default as UpmEmpty } from "./Empty.vue";

// --- Export Types
