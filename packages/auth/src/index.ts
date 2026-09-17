// -----------------------------------------------------------------------------
/**
 * @module auth
 * @description ADR 023 §3's `auth` box: login · register · 2FA · recover.
 * Imports `ui`, `headless` and `foundation` only — the page template and the
 * basket summary arrive through `foundation`'s shell socket (see `./shell`),
 * never an import, so the same organisms mount in a Vite app, a Nuxt app and
 * the standalone shell alike.
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

// --- Export the shell contract a host fills
export { AUTH_SHELL, AUTH_TEMPLATE_SLOT } from "./shell";
export type { AuthShellSlot } from "./shell";
export { default as UpmAuthBareTemplate } from "./templates/AuthBare.template.vue";

// --- Export the ADR 023 §8 contribution
export { clientAuthFeature, defineAuthFeature } from "./feature";
export type { AuthFeatureOptions } from "./feature";

// --- Export the routes/flows contract
export { AUTH_ROUTE, authRoutes } from "./routes";
export type { AuthRouteName, AuthRoutesOptions } from "./routes";
export {
  AUTH_QUERY,
  hasReturnTarget,
  readReturnTarget,
  registerAuthFlows
} from "./flows";
export type { AuthFlowOptions } from "./flows";

// --- Export utils
export { useAuthTemplates } from "./auth.utils";

// --- Export Types
export * from "./types";
