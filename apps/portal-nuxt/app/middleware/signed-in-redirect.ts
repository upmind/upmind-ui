// -----------------------------------------------------------------------------
/**
 * @module middleware/signed-in-redirect
 * @description Sends a signed-in client from the auth screens to its `returnUrl` or the landing.
 */
import {
  readReturnTarget,
  useActiveSession
} from "@upmind-automation/headless";
import { AUTH_LANDING } from "~/portal/auth-routes";

export default defineNuxtRouteMiddleware(async to => {
  const { isReady } = useActiveSession().useActions();
  // The session hydrates asynchronously; before this a signed-in client reads as signed out.
  await isReady();

  const { isAuthenticated } = useActiveSession().useMeta();
  if (!isAuthenticated.value) return undefined;

  // Only `readReturnTarget` decides same-origin; a refused target falls through to the landing.
  const target = readReturnTarget(to.query);
  if (target) return navigateTo(target, { replace: true });

  return navigateTo(AUTH_LANDING, { replace: true });
});
