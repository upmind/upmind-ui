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
import type { RouteLocationAsRelativeGeneric } from "vue-router";

export const AUTH_ROUTES: SessionRoutes = {
  loginRoute: { name: "login" },
  registerRoute: { name: "register" },
  recoverRoute: { name: "forgotten-password" }
};

/**
 * Where an accepted sign-in lands. The organisms otherwise ask the routing
 * engine for the next funnel step, and this app runs no funnel, so nothing but
 * the host can name a destination. Only the two screens that sign a client IN
 * take it: recovery ends on its own screen, showing the email-sent feedback.
 *
 * `signed-in-redirect` names it too, as where a client who already holds a
 * session goes. Typed as the route rather than the optional prop, so that
 * guard's destination cannot read as "nowhere".
 */
export const AUTH_LANDING: RouteLocationAsRelativeGeneric = { name: "index" };
