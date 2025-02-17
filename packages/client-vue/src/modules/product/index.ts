import { defineAsyncComponent } from "vue";

// -----------------------------------------------------------------------------

// --- Export Views
// NB: for views that are used in routes, we need to use defineAsyncComponent
// to avoid circular dependencies. and to be able to lazy load them.

export const UpmProductAddView = defineAsyncComponent(
  () => import("./AddView.vue")
);
export const UpmProductEditView = defineAsyncComponent(
  () => import("./EditView.vue")
);
export const UpmProductNotFoundView = defineAsyncComponent(
  () => import("./NotFoundView.vue")
);
export const UpmProductRequiresActionView = defineAsyncComponent(
  () => import("./RequiresActionView.vue")
);
export const UpmProductConfigView = defineAsyncComponent(
  () => import("./ConfigView.vue")
);
// --- Export Components

export const UpmProductConfig = defineAsyncComponent(
  () => import("./components/config/Config.vue")
);

// --- Export Types
