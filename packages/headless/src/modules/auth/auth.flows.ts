/**
 * @module auth/flows
 * @description Hands an authenticated visitor on an opted-in auth route back to its return target.
 */
import { watch } from "vue";
import { QUERY_PARAMS } from "@upmind-automation/types";
import { useActiveSession } from "../session-store";
import { every } from "lodash-es";
import type { AuthFlowOptions } from "./auth.types";
import type {
  RouteLocationNormalizedLoaded,
  RouteLocationRaw,
  Router
} from "vue-router";

/** Two probes: a target carrying its own authority matches at most one, so `//localhost/x` fails. */
const PROBE_ORIGINS = ["http://probe-a.invalid", "https://probe-b.invalid"];

function isSameOrigin(target: string): boolean {
  return every(PROBE_ORIGINS, origin => {
    try {
      return new URL(target, origin).origin === origin;
    } catch {
      return false;
    }
  });
}

/** The query's `returnUrl` as a normalised same-origin path, or undefined when it is refused or absent. */
export function readReturnTarget(
  query: Record<string, unknown>
): string | undefined {
  const raw = query[QUERY_PARAMS.RETURN_URL];

  if (typeof raw !== "string" || raw === "") return undefined;
  if (!raw.startsWith("/")) return undefined;
  if (!isSameOrigin(raw)) return undefined;

  const { pathname, search, hash } = new URL(raw, PROBE_ORIGINS[0]);
  const target = `${pathname}${search}${hash}`;

  // Normalising folds `\` and `..`, so `/..//evil.example` can surface a host: test again.
  if (!isSameOrigin(target)) return undefined;

  return target;
}

/** Whether the query names a `returnUrl` at all, accepted or refused. */
export function hasReturnTarget(query: Record<string, unknown>): boolean {
  const raw = query[QUERY_PARAMS.RETURN_URL];

  return typeof raw === "string" && raw !== "";
}

/** The verdict, never the target: echoing a refused string would print attacker text. */
export const AUTH_QUERY = {
  RETURN_REFUSED: "returnRefused"
} as const;

function handBackTarget(
  route: RouteLocationNormalizedLoaded,
  options: AuthFlowOptions
): RouteLocationRaw | undefined {
  if (!route.meta.authReturnTarget) return undefined;

  const { isAuthenticated } = useActiveSession().useMeta();

  if (!isAuthenticated.value) return undefined;

  const target = readReturnTarget(route.query);

  if (target) return target;

  if (hasReturnTarget(route.query) && options.fallback)
    return {
      path: options.fallback,
      query: { [AUTH_QUERY.RETURN_REFUSED]: "1" }
    };

  return undefined;
}

/** Sends a signed-in visitor on an opted-in auth route to its return target, else to the fallback. */
export function registerAuthFlows(
  engine: Router,
  options: AuthFlowOptions = {}
): void {
  engine.beforeEach(to => handBackTarget(to, options) ?? true);

  const { isAuthenticated } = useActiveSession().useMeta();

  watch(isAuthenticated, authenticated => {
    if (!authenticated) return;

    const route = engine.currentRoute.value;
    const target = handBackTarget(route, options);

    if (target) return void engine.replace(target);

    if (route.meta.authReturnTarget && options.fallback)
      void engine.replace(options.fallback);
  });
}
