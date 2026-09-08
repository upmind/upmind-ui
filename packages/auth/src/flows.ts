/**
 * @module auth/flows
 * @description This package's own navigation rule: once a visitor is
 * authenticated, an auth route it owns hands control back to the return target
 * it was launched with (`?returnUrl=`). The guard fires ONLY on a record
 * carrying `meta.authReturnTarget`, which `authRoutes({ returnTarget: true })`
 * sets — a host driving navigation from its own funnel is untouched.
 */
import { QUERY_PARAMS, useActiveSession } from "@upmind-automation/headless";
import type { Router } from "vue-router";

/** Reads the return target off a route's query, rejecting anything off-origin. */
export function readReturnTarget(
  query: Record<string, unknown>
): string | undefined {
  const raw = query[QUERY_PARAMS.RETURN_URL];

  if (typeof raw !== "string" || raw === "") return undefined;
  // A bare path only: an absolute or protocol-relative target would make the
  // return hop an open redirect.
  if (raw.startsWith("//") || /^[a-z][a-z0-9+.-]*:/i.test(raw))
    return undefined;
  if (!raw.startsWith("/")) return undefined;

  return raw;
}

export function registerAuthFlows(engine: Router): void {
  engine.beforeEach(to => {
    if (!to.meta.authReturnTarget) return true;

    const { isAuthenticated } = useActiveSession().useMeta();

    if (!isAuthenticated.value) return true;

    const target = readReturnTarget(to.query);

    if (!target) return true;

    return target;
  });
}
