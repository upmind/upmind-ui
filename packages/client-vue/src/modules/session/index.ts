// -----------------------------------------------------------------------------
/**
 * @module modules/session
 * @description The organisms moved to `@upmind-automation/auth` in the ADR 023
 * cut; what stays here is the SHELL they render inside (Amendment 1 change 3).
 * The barrel keeps every export name it had, so an app that has not been
 * rewired to the package yet is unaffected.
 */

// --- Export Views (now owned by @upmind-automation/auth)
// The `Session*` spelling survives HERE and nowhere else. `apps/velia` and
// `apps/hosting` are separate repositories that import these names from this
// package, and this package is deleted in the final phase — so the aliases are
// a compatibility shim with a known end date, not a second vocabulary.
export {
  UpmAuthAction,
  UpmAuthLogin as UpmSessionLogin,
  UpmAuthRegister as UpmSessionRegister,
  UpmAuthLogout as UpmSessionLogout,
  UpmAuthRecoverPassword as UpmSessionRecoverPassword
} from "@upmind-automation/auth";

// --- Export Components
export { UpmAccount, UpmAuth } from "@upmind-automation/auth";

// --- Export the shell entries the socket is filled with
export { SESSION_SHELL_COMPONENTS } from "./shell";

// --- Export Types
export {
  AUTH_FORMS as SESSION_FORMS,
  AUTH_TEMPLATE as SESSION_TEMPLATE
} from "@upmind-automation/auth";
export type {
  ActionProps,
  AuthActionProps,
  AuthExpiredProps as SessionExpiredProps,
  AuthProps as SessionProps,
  AuthRoutes as SessionRoutes
} from "@upmind-automation/auth";
