// -----------------------------------------------------------------------------
/**
 * @module portal/auth-routes
 * @description Where this app's own auth paths live, handed to the
 * `@upmind-automation/auth` organisms as their cross-links. The package
 * contributes no route records here (`auth: { routes: false }`) — the paths are
 * this app's, so the mapping is too. The names are the ones Nuxt derives from
 * `app/pages/*.vue`.
 */
import type { SessionRoutes } from "@upmind-automation/auth";

export const AUTH_ROUTES: SessionRoutes = {
  loginRoute: { name: "login" },
  registerRoute: { name: "register" },
  recoverRoute: { name: "forgotten-password" }
};
