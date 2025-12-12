// -----------------------------------------------------------------------------

import { defineAsyncComponent } from "vue";

// --- Export Views
// NB: for views that are used in routes, we need to use defineAsyncComponent
// to avoid circular dependencies. and to be able to lazy load them.

export const UpmCatalogue = defineAsyncComponent(
  () => import("./Catalogue.vue")
);
export const UpmCategories = defineAsyncComponent(
  () => import("./categories/Categories.vue")
);
export const UpmProducts = defineAsyncComponent(
  () => import("./products/WidgetGrid.vue")
);

// --- Export Types
export type * from "./categories/types";
export type * from "./products/types";
