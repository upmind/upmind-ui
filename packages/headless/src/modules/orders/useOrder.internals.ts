import type { OrderItemQuery } from "./orders.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module orders/useOrder.internals
 * @description Manager internals (debugging). Exposes the raw TanStack
 * query object backing the single read.
 * @doctrine clause 1 (uniform four-layer default) — TanStack-variant form.
 */
export function createOrderInternals(
  actorScope: ScopeActorTypes,
  query: OrderItemQuery
) {
  return {
    /** Actor scope for this instance. */
    actorScope,

    /** Raw TanStack query object backing the single read. */
    query
  };
}

// Type export for consumers
export type UseOrderManagerInternals = ReturnType<typeof createOrderInternals>;
