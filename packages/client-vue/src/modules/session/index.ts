// -----------------------------------------------------------------------------

import { defineAsyncComponent } from "vue";

// --- Export Views
// NB: for views that are used in routes, we need to use defineAsyncComponent
// to avoid circular dependencies. and to be able to lazy load them.

export const UpmAuthAction = defineAsyncComponent(
  () => import("./AuthAction.vue")
);
export const UpmSessionLogin = defineAsyncComponent(
  () => import("./Login.vue")
);
export const UpmSessionRegister = defineAsyncComponent(
  () => import("./Register.vue")
);
export const UpmSessionLogout = defineAsyncComponent(
  () => import("./Logout.vue")
);
export const UpmSessionRecoverPassword = defineAsyncComponent(
  () => import("./RecoverPassword.vue")
);
// --- Export Components
export const UpmAuth = defineAsyncComponent(
  () => import("./components/Auth.vue")
);

// --- Export Types
export * from "./types";
