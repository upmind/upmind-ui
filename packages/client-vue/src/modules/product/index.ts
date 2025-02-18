import { defineAsyncComponent } from "vue";

// -----------------------------------------------------------------------------

// --- Export Views
// NB: for views that are used in routes, we need to use defineAsyncComponent
// to avoid circular dependencies. and to be able to lazy load them.

export const UpmProductAddView = defineAsyncComponent(
  () => import("./Add.vue")
);
export const UpmProductEditView = defineAsyncComponent(
  () => import("./Edit.vue")
);
export const UpmProductNotFoundView = defineAsyncComponent(
  () => import("./NotFound.vue")
);
export const UpmProductRequiresActionView = defineAsyncComponent(
  () => import("./RequiresAction.vue")
);
export const UpmProductConfigView = defineAsyncComponent(
  () => import("./Config.vue")
);
// --- Export Components

export const UpmProductConfig = defineAsyncComponent(
  () => import("./components/config/Config.vue")
);

// --- Export Types
