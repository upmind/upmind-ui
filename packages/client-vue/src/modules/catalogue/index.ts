// -----------------------------------------------------------------------------

// --- Export Views
// NB: for views that are used in routes, we need to use defineAsyncComponent
// to avoid circular dependencies. and to be able to lazy load them.

export const UpmShopView = import("./Catalogue.vue");

// --- Export Components
export { default as UpmShop } from "./Catalogue.vue";
export { default as UpmCategories } from "./categories/Categories.vue";
export { default as UpmProducts } from "./products/WidgetGrid.vue";

// --- Export Types
export type * from "./categories/types";
export type * from "./products/types";
