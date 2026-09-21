// -----------------------------------------------------------------------------
/**
 * @module middleware/signed-out-redirect
 * @description The mirror of `signed-in-redirect`: every page of the portal is
 * a signed-in client's, so a visitor holding no session is sent to the form
 * before the page paints.
 *
 * GLOBAL rather than per-page. The portal is dozens of routes under six
 * pillars, and a guard a new page has to remember to name is a guard that page
 * will not have. The public routes are named here instead — a short, closed set
 * that changes only when an auth screen is added.
 *
 * The session store hydrates from storage asynchronously, so the flag is read
 * only after `isReady()`. Without that wait a signed-in client on a cold load
 * reads as signed out, and is walked to the form they already passed.
 */
import { QUERY_PARAMS, useActiveSession } from "@upmind-automation/headless";
import { includes } from "lodash-es";
import { AUTH_ROUTES } from "~/portal/auth-routes";

/**
 * The routes a visitor holding no session is entitled to. Named by the route
 * NAME, which Nuxt derives from the file, so a path change cannot silently open
 * a portal page or close an auth one.
 */
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
  await isReady();

  const { isAuthenticated } = useActiveSession().useMeta();
  if (isAuthenticated.value) return undefined;

  // Carry where they were going, so signing in lands them there rather than on
  // the portal's front page. `signed-in-redirect` reads it back.
  return navigateTo(
    {
      ...AUTH_ROUTES.loginRoute,
      query: { [QUERY_PARAMS.RETURN_URL]: to.fullPath }
    },
    { replace: true }
  );
});
