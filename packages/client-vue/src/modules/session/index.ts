// -----------------------------------------------------------------------------
/**
 * @module modules/session
 * @description The organisms moved to `@upmind-automation/auth` in the ADR 023
 * cut; what stays here is the SHELL they render inside (Amendment 1 change 3).
 * The barrel keeps every export name it had, so an app that has not been
 * rewired to the package yet is unaffected.
 */

// --- Export Views (now owned by @upmind-automation/auth)
export {
  UpmAuthAction,
  UpmSessionLogin,
  UpmSessionRegister,
  UpmSessionLogout,
  UpmSessionRecoverPassword
} from "@upmind-automation/auth";

// --- Export Components
export { UpmAccount, UpmAuth } from "@upmind-automation/auth";

// --- Export the shell entries the socket is filled with
export { SESSION_SHELL_COMPONENTS } from "./shell";

// --- Export Types
export { SESSION_FORMS, SESSION_TEMPLATE } from "@upmind-automation/auth";
export type {
  ActionProps,
  AuthActionProps,
  SessionExpiredProps,
  SessionProps,
  SessionRoutes
} from "@upmind-automation/auth";
