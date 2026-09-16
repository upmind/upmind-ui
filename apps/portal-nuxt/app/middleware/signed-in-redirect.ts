// -----------------------------------------------------------------------------
/**
 * @module middleware/signed-in-redirect
 * @description The three auth screens are for a visitor who holds no session.
 * A client who already holds one is sent on before the form paints — to the
 * `returnUrl` that carried them here, or to this app's own landing.
 *
 * The auth package's `readReturnTarget` is the only thing that decides a return
 * target is same-origin. A second reading of that string here would be a second
 * way to walk the visitor off-origin, so the refusal arm falls through to the
 * landing rather than re-deciding.
 *
 * The session store hydrates from storage asynchronously, so the flag is read
 * only after `isReady()`. Without that wait a signed-in client on a cold load
 * reads as signed out, and keeps the form this guard exists to take away.
 */
import { readReturnTarget } from "@upmind-automation/auth";
import { useActiveSession } from "@upmind-automation/headless";
import { AUTH_LANDING } from "~/portal/auth-routes";

export default defineNuxtRouteMiddleware(async to => {
  const { isReady } = useActiveSession().useActions();
  await isReady();

  const { isAuthenticated } = useActiveSession().useMeta();
  if (!isAuthenticated.value) return undefined;

  const target = readReturnTarget(to.query);
  if (target) return navigateTo(target, { replace: true });

  return navigateTo(AUTH_LANDING, { replace: true });
});
