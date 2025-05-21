// -----------------------------------------------------------------------------

// --- Export Views
// NB: for views that are used in routes, we need to use defineAsyncComponent
// to avoid circular dependencies. and to be able to lazy load them.

export const UpmSessionLoginView = import("./Login.vue");
export const UpmSessionRegisterView = import("./Register.vue");
export const UpmSessionLogoutView = import("./Logout.vue");
export const UpmSessionRecoverPasswordView = import("./RecoverPassword.vue");

// --- Export Components

// --- Export Types
