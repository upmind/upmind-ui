import { ROUTE } from "..";
import {
  type FunnelContext,
  useRoutingEngine,
  useSession,
  type FunnelResponse,
  FunnelActions
} from "@upmind-automation/client-vue";

// -----------------------------------------------------------------------------

/**
 * Services to handle asynchronous operations and validations within states.
 * @param context
 * @returns  Promise<void>
 */
export default {
  guardSession: async ({
    targetRoute
  }: FunnelContext): Promise<FunnelResponse> => {
    const { router } = useRoutingEngine();

    // NB for session guard, we want to REJECT if authenticated, so that we can redirect away from auth pages
    // EXCEPT for the logout route, where we want to allow the user to proceed with logging out.
    if (targetRoute?.name === ROUTE.SESSION_END) {
      return {
        type: FunnelActions.NEXT
      };
    }

    const session = useSession();

    // Wait for session to be fully ready and authenticated if a transition is in progress
    await session.isReady();

    // Check if we are authenticated. We use the check method to ensure
    // we wait for the profile load to complete.
    if (
      session.meta.value.isAuthenticated ||
      (await session.isAuthenticated().catch(() => false))
    ) {
      // We are authenticated and profile is loaded
    } else {
      return Promise.reject();
    }

    const returnUrlRaw =
      targetRoute?.query?.returnUrl?.toString() || "/account";
    const isLoginPath =
      returnUrlRaw.includes("/login") || returnUrlRaw.includes("/auth");
    const finalReturnUrl = isLoginPath ? "/account" : returnUrlRaw;

    const resolvedRoute = router.resolve(finalReturnUrl);

    return {
      type: FunnelActions.REDIRECT,
      target: resolvedRoute.name
        ? {
            name: resolvedRoute.name,
            params: resolvedRoute.params,
            query: resolvedRoute.query
          }
        : { path: resolvedRoute.path || finalReturnUrl }
    };
  }
};
