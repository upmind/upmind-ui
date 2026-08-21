import {
  type FunnelContext,
  useRoutingEngine,
  useActiveSession,
  type FunnelResponse,
  FunnelActions
} from "@upmind-automation/client-vue";
import { ScopeActorTypes } from "@upmind-automation/headless";
import { ROUTE } from "..";
import { scenarioRoutes } from "../../../modules/scenarios/runtime/registry";
import { get, isArray, join, toString } from "lodash-es";
import {
  parseScopeSuffix,
  stripScopeSuffix
} from "~/composables/scope/scope-mapper";
// -----------------------------------------------------------------------------
/**
 * Services to handle asynchronous operations and validations within states.
 * @param context
 * @returns  Promise<void>
 */
export default {
  /**
   * Extract and validate scope from URL path segments.
   * Parses `:scopeSuffix` param and attaches parsed scope to route.meta.scopeConfig
   */
  extractScope: async ({
    targetRoute
  }: FunnelContext): Promise<FunnelResponse> => {
    if (!targetRoute?.params?.scopeSuffix) {
      // No scope suffix - valid, proceed
      return {
        type: FunnelActions.NEXT
      };
    }

    // Nuxt catch-all routes return an array of path segments
    const rawSuffix = targetRoute.params.scopeSuffix;
    const suffix = isArray(rawSuffix)
      ? join(rawSuffix, "/")
      : (rawSuffix as string);
    const parsed = parseScopeSuffix(suffix);

    if (!parsed.valid) {
      // Invalid scope format - redirect to base route without scope
      const basePath = stripScopeSuffix(targetRoute.path || "");
      console.warn(
        `[extractScope] Invalid scope suffix: ${parsed.error}. Redirecting to: ${basePath}`
      );

      return {
        type: FunnelActions.REDIRECT,
        target: { path: basePath }
      };
    }

    // Valid scope - attach to meta for composables to read
    if (targetRoute.meta) {
      targetRoute.meta.scopeConfig = {
        actor: parsed.actor,
        context: parsed.context
      };
    }

    return {
      type: FunnelActions.NEXT
    };
  },

  /**
   * Every scenario route's gate. A scenario boots as SELF unless the url names
   * an actor (`R6-30b`), and an unauthenticated visitor to either has nothing to
   * read — so rejecting toward SESSION is what makes the funnel collect auth
   * over the page (`<route>--auth`) instead of leaving it on skeletons that
   * never settle.
   */
  guardScenario: async ({
    currentRoute,
    targetRoute
  }: FunnelContext): Promise<FunnelResponse> => {
    const route = targetRoute ?? currentRoute;
    const scenario = get(scenarioRoutes, toString(route?.name));
    if (!scenario) return { type: FunnelActions.NEXT };

    const rawSuffix = get(route, ["params", "scopeSuffix"]);
    const actor =
      parseScopeSuffix(
        isArray(rawSuffix) ? join(rawSuffix, "/") : (rawSuffix as string)
      ).actor ?? ScopeActorTypes.SELF;

    if (actor === ScopeActorTypes.GUEST) return { type: FunnelActions.NEXT };

    const { isAuthenticated } = useActiveSession().useActions();
    const authenticated = await isAuthenticated()
      .then(() => true)
      .catch(() => false);

    if (authenticated) return { type: FunnelActions.NEXT };

    return Promise.reject({
      target: { name: ROUTE.SESSION }
    } as FunnelResponse);
  },

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

    const session = useActiveSession();
    const actions = session.useActions();
    const meta = session.useMeta();

    // Wait for session to be fully ready and authenticated if a transition is in progress
    await actions.isReady();

    // Check if we are authenticated
    if (meta.isAuthenticated.value) {
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
