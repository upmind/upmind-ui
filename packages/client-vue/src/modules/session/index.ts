import { defineAsyncComponent } from "vue";

// -----------------------------------------------------------------------------

// --- Export Views
// NB: for views that are used in routes, we need to use defineAsyncComponent
// to avoid circular dependencies. and to be able to lazy load them.

export const UpmSessionLoginView = defineAsyncComponent(
  () => import("./Login.vue")
);
export const UpmSessionRegisterView = defineAsyncComponent(
  () => import("./Register.vue")
);
export const UpmSessionLogoutView = defineAsyncComponent(
  () => import("./Logout.vue")
);

// --- Export Components

// --- Export Types
