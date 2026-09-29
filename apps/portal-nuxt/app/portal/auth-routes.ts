// -----------------------------------------------------------------------------
/**
 * @module portal/auth-routes
 * @description This app's auth paths, handed to the `@upmind-automation/auth` organisms.
 */
import type { AuthRoutes } from "@upmind-automation/auth";
import type { RouteLocationAsRelativeGeneric } from "vue-router";

export const AUTH_ROUTES: AuthRoutes = {
  loginRoute: { name: "login" },
  registerRoute: { name: "register" },
  recoverRoute: { name: "forgotten-password" }
};

export const AUTH_LANDING: RouteLocationAsRelativeGeneric = { name: "index" };
