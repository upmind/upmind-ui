import type { TicketsListQuery } from "./tickets.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module tickets/useTickets.internals
 * @description Collection internals (debugging). Exposes the raw TanStack
 * query object backing the collection.
 * @doctrine clause 1 (uniform four-layer default) — TanStack-variant form.
 */
export function createTicketsInternals(
  actorScope: ScopeActorTypes,
  query: TicketsListQuery
) {
  return {
    /** Actor scope for this instance. */
    actorScope,
    /** Raw TanStack query object backing the collection. */
    query
  };
}

// Type export for consumers
export type UseTicketsInternals = ReturnType<typeof createTicketsInternals>;
