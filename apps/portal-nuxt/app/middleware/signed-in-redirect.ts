// -----------------------------------------------------------------------------
/**
 * @module middleware/signed-in-redirect
 * @description Sends a signed-in client from the auth screens to the landing.
 */
import { useActiveSession } from "@upmind-automation/headless";
import { AUTH_LANDING } from "~/portal/auth-routes";

export default defineNuxtRouteMiddleware(async () => {
  const { isReady } = useActiveSession().useActions();
  // The session hydrates asynchronously; before this a signed-in client reads as signed out.
  await isReady();

  const { isAuthenticated } = useActiveSession().useMeta();
  if (!isAuthenticated.value) return undefined;

  return navigateTo(AUTH_LANDING, { replace: true });
});
