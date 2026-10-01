// -----------------------------------------------------------------------------
/**
 * @module orders
 * @description Public exports for the client order-history module — the
 * COLLECTION (`useOrders`) and the single-order MANAGER
 * (`useOrder`). `orders.services.ts` / `.schemas.ts` /
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

export { useOrders, type UseOrders } from "./useOrders";
export { useOrder, type UseOrder } from "./useOrder";

// --- Scope matrices. The manager's `ORDER_MANAGER_SCOPE_MATRIX` /
// `OrderManagerScopeMatrix` stay INTERNAL: the order being read is a
// record id (`.withId(id)`), never a context a consumer can spell, so
// neither is re-exported here (`templates/SINGLE-READ.md`).
export { ORDERS_SCOPE_MATRIX } from "./orders.types";
export type { OrdersCollectionScopeMatrix } from "./orders.types";

// --- Sub-composable type exports for consumers — collection
export type { UseOrdersCollectionActions } from "./useOrders.actions";
export type { UseOrdersCollectionContext } from "./useOrders.context";
export type { UseOrdersCollectionMeta } from "./useOrders.meta";
export type { UseOrdersCollectionInternals } from "./useOrders.internals";

// --- Sub-composable type exports for consumers — manager
export type { UseOrderManagerActions } from "./useOrder.actions";
export type { UseOrderManagerContext } from "./useOrder.context";
export type { UseOrderManagerMeta } from "./useOrder.meta";
export type { UseOrderManagerInternals } from "./useOrder.internals";

// --- Public model types
export { OrdersSortableColumn } from "./orders.types";
export type {
  OrderCancellationPort,
  OrderDetail,
  OrderItem,
  OrderStatusChoice,
  OrderSubItem,
  OrdersFilterActions,
  OrdersFilterModel,
  OrdersQueryModel,
  OrdersSortEntry,
  OrdersSortModel
} from "./orders.types";

// --- The order conditions (design 8.5, D-19) — the six new predicates this
// module owns. `isDue`/`isCancellable` are NOT re-exported here (see above).
export {
  canCancel,
  canPay,
  isCancelled,
  isOverdue,
  isPartiallyPaid,
  isPaid
} from "./orders.utils";

// --- The cancellation port (D-21, FE-3237 ticket AC14)
export { provideOrderCancellation } from "./orders.ports";
export { OrderCancellationUnavailableError } from "./orders.errors";
