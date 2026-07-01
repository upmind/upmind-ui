import {
  type FunnelContext,
  useRoutingEngine,
  useActiveSession,
  type FunnelResponse,
  FunnelActions,
  type FunnelTarget
} from "@upmind-automation/client-vue";
import { ROUTE } from "..";
import { includes } from "lodash-es";

// -----------------------------------------------------------------------------

/**
 * Services to handle asynchronous operations and validations within states.
 * @param context
 * @returns  Promise<void>
 */
export default {
  guardSession: async ({
    _currentRoute,
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

    const session = useActiveSession();
    const actions = session.useActions();
    const meta = session.useMeta();

    // Wait for session to be fully ready and authenticated if a transition is in progress
    await actions.isReady();

    // Check if we are authenticated.
    if (meta.isAuthenticated.value) {
      // We are authenticated and profile is loaded
    } else {
      return Promise.reject();
    }

    const returnUrlRaw = targetRoute?.query?.returnUrl?.toString();
    const sessionRoutes = [
      ROUTE.SESSION,
      ROUTE.SESSION_LOGIN,
      ROUTE.SESSION_REGISTER,
      ROUTE.SESSION_RECOVER_PASSWORD
    ];

    // Resolve the returnUrl via the router to get a named route
    const resolved = returnUrlRaw ? router.resolve(returnUrlRaw) : undefined;
    const isSessionRoute = resolved?.name
      ? includes(sessionRoutes, resolved.name as string)
      : false;

    const resolvedRoute =
      resolved && !isSessionRoute ? (resolved as FunnelTarget) : targetRoute;

    return {
      type: FunnelActions.REDIRECT,
      target: resolvedRoute
    };
  }
};
