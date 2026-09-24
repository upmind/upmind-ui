// -----------------------------------------------------------------------------
/**
 * @module modules/session
 * @description The shell the `@upmind-automation/auth` organisms render inside.
 */

// --- Export Views
// `apps/velia` and `apps/hosting` still import the `Session*` names.
export {
  UpmAuthAction,
  UpmAuthLogin as UpmSessionLogin,
  UpmAuthRegister as UpmSessionRegister,
  UpmAuthLogout as UpmSessionLogout,
  UpmAuthRecoverPassword as UpmSessionRecoverPassword
} from "@upmind-automation/auth";

// --- Export Components
export { UpmAccount, UpmAuth } from "@upmind-automation/auth";

// --- Export Shell
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
