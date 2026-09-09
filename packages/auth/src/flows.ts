/**
 * @module auth/flows
 * @description This package's own navigation rule: once a visitor is
 * authenticated, an auth route it owns hands control back to the return target
 * it was launched with (`?returnUrl=`), or to the host's own `fallback` when
 * that names nowhere this package will go. Both arms fire ONLY on a record
 * carrying `meta.authReturnTarget`, which `authRoutes({ returnTarget: true })`
 * sets — a host driving navigation from its own funnel is untouched.
 */
import { watch } from "vue";
import { QUERY_PARAMS, useActiveSession } from "@upmind-automation/headless";
import type {
  RouteLocationNormalizedLoaded,
  RouteLocationRaw,
  Router
} from "vue-router";

/**
 * Two origins, not one. A target that carries its own authority takes the host
 * from the string rather than the base, so it can match at most one probe —
 * which is how `//localhost/x` is caught as well as `//evil.example`.
 */
const PROBE_ORIGINS = ["http://probe-a.invalid", "https://probe-b.invalid"];

/**
 * Whether a target resolves back onto whichever origin it is read against, and
 * so names no host of its own.
 */
function isSameOrigin(target: string): boolean {
  return PROBE_ORIGINS.every(origin => {
    try {
      return new URL(target, origin).origin === origin;
    } catch {
      return false;
    }
  });
}

/** Reads the return target off a route's query, rejecting anything off-origin. */
export function readReturnTarget(
  query: Record<string, unknown>
): string | undefined {
  const raw = query[QUERY_PARAMS.RETURN_URL];

  if (typeof raw !== "string" || raw === "") return undefined;
  // The contract is one bare absolute path. A relative target would resolve
  // against the auth route it is read on, not against the site root.
  if (!raw.startsWith("/")) return undefined;
  if (!isSameOrigin(raw)) return undefined;

  const { pathname, search, hash } = new URL(raw, PROBE_ORIGINS[0]);
  const target = `${pathname}${search}${hash}`;

  // Normalisation can surface an authority the raw string hid: the URL parser
  // folds `\` to `/` and collapses `..`, so `/..//evil.example` reads as a path
  // here and as a host once handed on. The result has to pass the same test.
  if (!isSameOrigin(target)) return undefined;

  return target;
}

/** Whether a query asked to be sent anywhere at all, refused or not. */
export function hasReturnTarget(query: Record<string, unknown>): boolean {
  const raw = query[QUERY_PARAMS.RETURN_URL];

  return typeof raw === "string" && raw !== "";
}

/**
 * Query the hand-back adds to the fallback landing. It carries the VERDICT, not
 * the target: echoing a refused string back into the URL would put an
 * attacker's own text on the page that reports refusing it.
 */
export const AUTH_QUERY = {
  RETURN_REFUSED: "returnRefused"
} as const;

export type AuthFlowOptions = {
  /**
   * Where an authenticated visitor lands when the route named no usable return
   * target. Without it, a host with no funnel of its own strands the visitor on
   * the form that just accepted them.
   */
  fallback?: string;
};

/** Where this route should send an authenticated visitor, if anywhere. */
function handBackTarget(
  route: RouteLocationNormalizedLoaded,
  options: AuthFlowOptions
): RouteLocationRaw | undefined {
  if (!route.meta.authReturnTarget) return undefined;

  const { isAuthenticated } = useActiveSession().useMeta();

  if (!isAuthenticated.value) return undefined;

  const target = readReturnTarget(route.query);

  if (target) return target;

  // Asked to be sent somewhere this package would not go. The landing is told
  // which it was, because a refusal reaching the same screen as "nobody asked"
  // is the silent recovery this branch exists to make visible.
  if (hasReturnTarget(route.query) && options.fallback)
    return {
      path: options.fallback,
      query: { [AUTH_QUERY.RETURN_REFUSED]: "1" }
    };

  return undefined;
}

export function registerAuthFlows(
  engine: Router,
  options: AuthFlowOptions = {}
): void {
  // Arriving already authenticated: the navigation in flight IS the hand-back.
  engine.beforeEach(to => handBackTarget(to, options) ?? true);

  const { isAuthenticated } = useActiveSession().useMeta();

  // Becoming authenticated while already ON an auth route. No navigation is in
  // flight for the guard above to redirect, and the organism's own `doResolve`
  // asks the funnel engine to move — which a host with no funnel cannot answer,
  // so without this the visitor is stranded on the form that just accepted them.
  watch(isAuthenticated, authenticated => {
    if (!authenticated) return;

    const route = engine.currentRoute.value;
    const target = handBackTarget(route, options);

    if (target) return void engine.replace(target);

    // Nothing asked us to send them on. Only THIS arm falls through to the
    // landing: the guard above must still let an authenticated visitor reach
    // an auth route it was handed back to, or the hand-back's own destination
    // would be taken off it.
    if (route.meta.authReturnTarget && options.fallback)
      void engine.replace(options.fallback);
  });
}
