import { translateQuery } from "../query";
import type { QueryProps } from "../query";
import type { OrdersListQuery } from "./orders.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module orders/useOrders.internals
 * @description Collection internals (debugging). Exposes the raw TanStack
 * query object backing the collection and the wire the live criteria
 * BUILDS — nothing here is requested. The playground filter bar writes
 * through `query.setCriteria` (design 8.3 "the raw setter").
 * @doctrine clause 1 (uniform four-layer default) — TanStack-variant form.
 */
export function createOrdersInternals(
  actorScope: ScopeActorTypes,
  query: OrdersListQuery
) {
  return {
    /** Actor scope for this instance. */
    actorScope,

    /** Raw TanStack query object backing the collection. */
    query,

    /** Diagnostics: the wire the live criteria BUILDS — nothing is requested. */
    translateQuery: (): QueryProps =>
      translateQuery(query.schema, query.criteria.value)
  };
}

// Type export for consumers. Named `...Collection...` —
// `UseOrdersInternals` collides with the portal mock contract
// (`orders.types.ts` head `@decision`).
export type UseOrdersCollectionInternals = ReturnType<
  typeof createOrdersInternals
>;
