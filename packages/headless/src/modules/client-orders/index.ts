// -----------------------------------------------------------------------------
/**
 * @module client-orders
 * @description Public exports for the client order-history module — the
 * COLLECTION (`useClientOrders`) only in this build pass. `client-orders.
 * services.ts` / `client-orders.schemas.ts` each carry their own line-1
 * internal marker and are never imported directly by another module
 * (`@internal/no-cross-module-imports`); this barrel never re-exports one
 * of them wholesale (`@internal/no-barrel-imports`) — curated named
 * re-exports only.
 *
 * The single-record manager (`useClientOrder`), the mappers, the
 * cancellation port and the pay delegate are NOT part of this pass — see
 * this build's hand-off. Their public names are reserved by design.md 5.2
 * but not yet declared here.
 */

export { useClientOrders, type UseClientOrders } from "./useClientOrders";

// --- Scope matrix
export { CLIENT_ORDERS_SCOPE_MATRIX } from "./client-orders.types";
export type { ClientOrdersCollectionScopeMatrix } from "./client-orders.types";

// --- Sub-composable type exports for consumers
export type { UseClientOrdersCollectionActions } from "./useClientOrders.actions";
export type { UseClientOrdersCollectionContext } from "./useClientOrders.context";
export type { UseClientOrdersCollectionMeta } from "./useClientOrders.meta";
export type { UseClientOrdersCollectionInternals } from "./useClientOrders.internals";

// --- Public model types
export { ClientOrdersSortableColumn } from "./client-orders.types";
export type {
  ClientOrderStatusChoice,
  ClientOrdersFilterActions,
  ClientOrdersFilterModel,
  ClientOrdersQueryModel,
  ClientOrdersSortEntry,
  ClientOrdersSortModel
} from "./client-orders.types";
