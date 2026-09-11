import {
  type FunnelContext,
  useRoutingEngine,
  useActiveSession,
  useQueryParams,
  type FunnelResponse,
  FunnelActions,
  QUERY_PARAMS
} from "@upmind-automation/client-vue";
import {
  ScopeActorTypes,
  useInvoice,
  useOperations
} from "@upmind-automation/headless";
import { InvoiceStatus } from "@upmind-automation/types";
import { ROUTE } from "..";
import { scenarioRoutes } from "../../../modules/scenarios/runtime/registry";
import { intentOverlayTarget } from "../labs";
import { INIT_INTENT_OVERLAY, InitIntent } from "../labs.constants";
import {
  endsWith,
  get,
  includes,
  isArray,
  isEmpty,
  join,
  startsWith,
  toString
} from "lodash-es";
import type { RouteLocation } from "vue-router";
import {
  parseScopeSuffix,
  stripScopeSuffix
} from "~/composables/scope/scope-mapper";
import { usePlaygroundUrlState } from "~/composables/usePlaygroundUrlState";
// -----------------------------------------------------------------------------

/**
 * The bound this funnel puts on a screen's own readiness, in the shape
 * `useOrder.isReady()` already uses (`useOrder.ts:95-103`).
 */
const INTENT_READINESS_TIMEOUT = 30_000;

/** Resolves `false` when the wait has not settled inside the bound. */
function bounded(ready: Promise<boolean>): Promise<boolean> {
  return new Promise<boolean>(resolve => {
    const bound = setTimeout(() => resolve(false), INTENT_READINESS_TIMEOUT);

    void ready
      .catch(() => false)
      .then(settled => {
        clearTimeout(bound);
        resolve(settled);
      });
  });
}

/**
 * Whether the intent's own screen admits it, read off that screen's SETTLED
 * data.
 *
 * `pay` is legacy's exact predicate — `!isPaid`, the status not being `PAID`
 * (`store/modules/data/invoices/index.ts:84-86`) — so DRAFT, CANCELLED,
 * REFUNDED, REPLACED and CANCELLATION_REQUEST all admit, because legacy
 * admitted them. An invoice that never arrived admits nothing: a 404 leaves
 * nothing to pay and no surface to open over.
 *
 * The readiness wait is BOUNDED, and hitting the bound is a refusal.
 * `useInvoice.isReady()` resolves only from a bare `setInterval` poll with no
 * timeout and no reject (`packages/headless/src/modules/invoices/useInvoice.ts:46-58`),
 * and this guard is awaited inside navigation-blocking middleware
 * (`app/middleware/routing.global.ts:30`) — so an unsettled wait would be an app
 * with no page.
 */
async function admitsIntent(
  intent: InitIntent,
  route: RouteLocation
): Promise<boolean> {
  // STUB until CT-1 (FE-3029) + CT-2 (FE-3206). The real gate is
  // `canUpgradeDowngradeAsClient` (`cProdProvider.vue:347-355`), which reads the
  // contracts module CT-1 has not built yet; a guessed gate is worse than none.
  if (intent === InitIntent.UPGRADE) return true;

  const invoiceId = useQueryParams(route).getParam(QUERY_PARAMS.ORDER_ID);
  if (!invoiceId) return false;

  const { data, isReady } = useInvoice(toString(invoiceId));
  if (!(await bounded(isReady()))) return false;

  return !isEmpty(data.value) && data.value?.status !== InvoiceStatus.PAID;
}

/**
 * Every scenario route's gate. A scenario boots as SELF unless the url names an
 * actor (`R6-30b`), and an unauthenticated visitor to either has nothing to
 * read — so rejecting toward SESSION is what makes the funnel collect auth over
 * the page (`<route>--session`) instead of leaving it on skeletons that never
 * settle.
 */
async function guardScenario({
  currentRoute,
  targetRoute
}: FunnelContext): Promise<FunnelResponse> {
  const route = targetRoute ?? currentRoute;
  const scenario = get(scenarioRoutes, toString(route?.name));
  if (!scenario) return { type: FunnelActions.NEXT };

  const rawSuffix = get(route, ["params", "scopeSuffix"]);
  const actor =
    parseScopeSuffix(
      isArray(rawSuffix) ? join(rawSuffix, "/") : (rawSuffix as string)
    ).actor ?? ScopeActorTypes.SELF;

  const offeredActors = scenario.actors ?? [];

  if (
    actor === ScopeActorTypes.GUEST ||
    includes(offeredActors, actor) ||
    includes(offeredActors, ScopeActorTypes.GUEST)
  )
    return { type: FunnelActions.NEXT };

  const { isAuthenticated } = useActiveSession().useActions();
  const authenticated = await isAuthenticated()
    .then(() => true)
    .catch(() => false);

  if (authenticated) return { type: FunnelActions.NEXT };

  return Promise.reject({
    target: { name: ROUTE.SESSION }
  } as FunnelResponse);
}

/**
 * `?init=<intent>` — the EMAIL's instruction to the screen. It reads the param,
 * waits for that screen's own data to settle, decides per value, and rejects
 * with the overlay child which answers the intent. It opens nothing itself: the
 * funnel assigns the target and the middleware navigates it, the exercised
 * `guardAuthenticated` → `authOverlayTarget` shape.
 *
 * The param is cleared on EVERY path, refusals and unrecognised values
 * included, because legacy strips it outside its own `if`
 * (`invoiceProvider.vue:431-432`, `cProdProvider.vue:945-946`).
 */
async function guardInitIntent({
  currentRoute,
  targetRoute
}: FunnelContext): Promise<FunnelResponse> {
  const route = (targetRoute ?? currentRoute) as RouteLocation;

  // `getParam`, never `consumeParam`: a clear on read would strip the param
  // before the gate had decided and before the target could be built.
  const intent = useQueryParams(route).getParam(QUERY_PARAMS.INIT);
  if (!intent) return { type: FunnelActions.NEXT };

  try {
    const overlay = get(INIT_INTENT_OVERLAY, toString(intent));

    if (overlay && (await admitsIntent(intent as InitIntent, route)))
      return Promise.reject({
        target: intentOverlayTarget(route, overlay)
      } as FunnelResponse);

    return { type: FunnelActions.NEXT };
  } finally {
    // The playground's ONE url writer, and `undefined` is its clear sentinel.
    // `useQueryParams().unsetParam` writes `window.location` behind the bag,
    // whose next write of any surface param rebuilds the whole query from its
    // own stale state and re-stamps `init` (`usePlaygroundUrlState.ts:13-18`).
    usePlaygroundUrlState().write({ [QUERY_PARAMS.INIT]: undefined });
  }
}

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

  guardScenario,

  /**
   * The session gate, THEN the intent — the order is the invariant. An `?init`
   * intent may not fire for a visitor the session gate is about to bounce, or
   * the overlay opens over a page that never renders.
   *
   * One invocation owns the state, so the two rejections are told apart by the
   * target each carries: `isSession` takes the auth arm, and anything else is
   * the intent's own overlay child.
   */
  guardScenarioIntent: async (
    context: FunnelContext
  ): Promise<FunnelResponse> => {
    await guardScenario(context);

    return guardInitIntent(context);
  },

  /**
   * A plain page's session gate. `guardScenario` early-returns for any route it
   * cannot find in the scenario registry, so a hand-authored page it does not
   * know about is never gated — this is that gate, the same session check
   * without the scenario lookup or the scope-suffix actor read.
   */
  guardAuthenticated: async (): Promise<FunnelResponse> => {
    const { isAuthenticated } = useActiveSession().useActions();
    const authenticated = await isAuthenticated()
      .then(() => true)
      .catch(() => false);

    if (authenticated) return { type: FunnelActions.NEXT };

    return Promise.reject({
      target: { name: ROUTE.SESSION }
    } as FunnelResponse);
  },

  guardInitIntent,

  /**
   * The order page's gate. An off-site return lands here carrying
   * `?operation_id`; the operation names the work, so the guard runs it and
   * proceeds (FE-3133). An unknown reference names nothing and is ignored.
   *
   * The page is also where `?init=pay` lands — the order page IS the invoice pay
   * page — so the intent runs on this same invocation rather than on a second
   * state, and rejects toward the pay-init overlay when the invoice is payable.
   */
  guardOrderReturn: async (context: FunnelContext): Promise<FunnelResponse> => {
    const route = context.targetRoute ?? context.currentRoute;
    const { executeOperation, getOperation } = useOperations();

    const operationId = useQueryParams(route as RouteLocation).consumeParam(
      QUERY_PARAMS.OPERATION_ID
    );

    if (operationId && getOperation(operationId))
      await executeOperation(operationId);

    return guardInitIntent(context);
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

    // Default to home, not "/account" which would set brandIdOrOrg="account"
    const returnUrlRaw = targetRoute?.query?.returnUrl?.toString() || "/";

    // Matched by resolved route NAME, never by a path substring. The overlay
    // suffix was renamed `--auth` → `--session`, so `includes("/auth")` stopped
    // matching the very surface it exists to refuse — and a path test would
    // have caught any brand slug that happened to read `/login` too.
    const resolved = router.resolve(returnUrlRaw);
    const resolvedName = toString(resolved.name);
    const isSessionRoute =
      startsWith(resolvedName, ROUTE.SESSION) ||
      endsWith(resolvedName, `--${ROUTE.SESSION}`);

    const finalReturnUrl = isSessionRoute ? "/" : returnUrlRaw;
    const resolvedRoute = isSessionRoute ? router.resolve("/") : resolved;

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
