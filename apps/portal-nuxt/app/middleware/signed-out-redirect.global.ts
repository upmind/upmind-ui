// -----------------------------------------------------------------------------
/**
 * @module middleware/signed-out-redirect
 * @description Sends a visitor holding no session from any portal page to the login form.
 */
import { QUERY_PARAMS, useActiveSession } from "@upmind-automation/headless";
import { includes } from "lodash-es";
import { AUTH_ROUTES } from "~/portal/auth-routes";

const PUBLIC_ROUTES = [
  "login",
  "register",
  "register-org",
  "forgotten-password",
  "reset-password",
  "verify",
  "verify-email",
  "logout"
];

export default defineNuxtRouteMiddleware(async to => {
  if (includes(PUBLIC_ROUTES, String(to.name))) return undefined;

  const { isReady } = useActiveSession().useActions();
  // The session hydrates asynchronously; before this a signed-in client reads as signed out.
  await isReady();

  const { isAuthenticated } = useActiveSession().useMeta();
  if (isAuthenticated.value) return undefined;

  return navigateTo(
    {
      ...AUTH_ROUTES.loginRoute,
      query: { [QUERY_PARAMS.RETURN_URL]: to.fullPath }
    },
    { replace: true }
  );
});
