// -----------------------------------------------------------------------------
/**
 * @module client-orders
 * @description Public exports for the client order-history module — the
 * COLLECTION (`useClientOrders`) and the single-order MANAGER
 * (`useClientOrder`). `client-orders.services.ts` / `.schemas.ts` /
 * `.mappers.ts` each carry their own line-1 internal marker and are never
 * imported directly by another module (`@internal/no-cross-module-imports`);
 * this barrel never re-exports one of them wholesale
 * (`@internal/no-barrel-imports`) — curated named re-exports only.
 *
 * The barrel does NOT re-export `isDue`/`isCancellable` — the FE-3029
 * `contract-product` barrel exports them already, and a second export of
 * the same name through `export *` gives the ambiguous re-export error
 * TS2308 (design 8.6, D-19). A consumer imports the two from
 * `packages/headless/src/modules/index.ts` directly.
 */

export { useClientOrders, type UseClientOrders } from "./useClientOrders";
export { useClientOrder, type UseClientOrder } from "./useClientOrder";

// --- Scope matrices. The manager's `CLIENT_ORDER_MANAGER_SCOPE_MATRIX` /
// `ClientOrderManagerScopeMatrix` stay INTERNAL: the order being read is a
// record id (`.withId(id)`), never a context a consumer can spell, so
// neither is re-exported here (`templates/SINGLE-READ.md`).
export { CLIENT_ORDERS_SCOPE_MATRIX } from "./client-orders.types";
export type { ClientOrdersCollectionScopeMatrix } from "./client-orders.types";

// --- Sub-composable type exports for consumers — collection
export type { UseClientOrdersCollectionActions } from "./useClientOrders.actions";
export type { UseClientOrdersCollectionContext } from "./useClientOrders.context";
export type { UseClientOrdersCollectionMeta } from "./useClientOrders.meta";
export type { UseClientOrdersCollectionInternals } from "./useClientOrders.internals";

// --- Sub-composable type exports for consumers — manager
export type { UseClientOrderManagerActions } from "./useClientOrder.actions";
export type { UseClientOrderManagerContext } from "./useClientOrder.context";
export type { UseClientOrderManagerMeta } from "./useClientOrder.meta";
export type { UseClientOrderManagerInternals } from "./useClientOrder.internals";

// --- Public model types
export { ClientOrdersSortableColumn } from "./client-orders.types";
export type {
  ClientOrderCancellationPort,
  ClientOrderDetail,
  ClientOrderItem,
  ClientOrderStatusChoice,
  ClientOrderSubItem,
  ClientOrdersFilterActions,
  ClientOrdersFilterModel,
  ClientOrdersQueryModel,
  ClientOrdersSortEntry,
  ClientOrdersSortModel
} from "./client-orders.types";

// --- The order conditions (design 8.5, D-19) — the six new predicates this
// module owns. `isDue`/`isCancellable` are NOT re-exported here (see above).
export {
  canCancel,
  canPay,
  isCancelled,
  isOverdue,
  isPartiallyPaid,
  isPaid
} from "./client-orders.utils";

// --- The cancellation port (D-21, FE-3237 ticket AC14)
export { provideOrderCancellation } from "./client-orders.ports";
export { OrderCancellationUnavailableError } from "./client-orders.errors";
