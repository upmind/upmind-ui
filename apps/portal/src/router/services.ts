import { ROUTE } from ".";
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
    const { isAuthenticated } = useSession();
    const { router } = useRoutingEngine();

    // NB for session guard, we want to REJECT if authenticated, so that we can redirect away from auth pages
    const returnUrl = router.resolve(
      targetRoute?.query?.returnUrl?.toString() || "/"
    );

    return isAuthenticated()
      .then(() => {
        return {
          type: FunnelActions.REDIRECT,
          target: {
            name: returnUrl.name ?? ROUTE.HOME,
            params: returnUrl.params,
            query: returnUrl.query
          }
        };
      })
      .catch(() => {
        // we are not authenticated, so reject and allow auth flow to continue
        return Promise.reject();
      });
  }
};
