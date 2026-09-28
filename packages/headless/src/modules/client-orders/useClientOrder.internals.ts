import type { ClientOrderItemQuery } from "./client-orders.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-orders/useClientOrder.internals
 * @description Manager internals (debugging). Exposes the raw TanStack
 * query object backing the single read.
 * @doctrine clause 1 (uniform four-layer default) — TanStack-variant form.
 */
export function createClientOrderInternals(
  actorScope: ScopeActorTypes,
  query: ClientOrderItemQuery
) {
  return {
    /** Actor scope for this instance. */
    actorScope,

    /** Raw TanStack query object backing the single read. */
    query
  };
}

// Type export for consumers
export type UseClientOrderManagerInternals = ReturnType<
  typeof createClientOrderInternals
>;
