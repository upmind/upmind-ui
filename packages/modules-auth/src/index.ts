// -----------------------------------------------------------------------------
/**
 * @module auth
 * @description The `auth` package: login · register · 2FA · recover.
 */

// --- Export Views
export { default as UpmAuthAction } from "./AuthAction.vue";
export { default as UpmAuthLogin } from "./Login.vue";
export { default as UpmAuthRegister } from "./Register.vue";
export { default as UpmAuthLogout } from "./Logout.vue";
export { default as UpmAuthRecoverPassword } from "./RecoverPassword.vue";

// --- Export Components
export { default as UpmAccount } from "./components/Account.vue";
export { default as UpmAuth } from "./components/Auth.vue";
export { default as UpmAuthLoading } from "./components/AuthLoading.vue";

// --- Export Types
export * from "./types";
