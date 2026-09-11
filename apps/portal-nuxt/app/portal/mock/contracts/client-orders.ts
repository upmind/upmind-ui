// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-orders
 * @description Four-layer contract for the `client-orders` module headless
 * does not have yet (plan §3): the paged order collection (`useClientOrders`)
 * and the per-order manager (`useClientOrder`). Rows are the wire `IOrder` —
 * an order IS an invoice on the wire, so no row type is minted here.
 *
 * @oracle vue-app `origin/master` @ `7f259e0e12`, client area — the orders
 * listing (`*Listing.vue`) and the order overview/details; gap-doc rows
 * "3. Billing → Orders", X1, X8.
 */

import { AccessRoleTypes } from "@upmind-automation/types";
import { NO_ACTOR_CONTEXT, SCOPE_ACTOR } from "./scope";
import type { ContractInternals } from "./scope";
import type {
  ActorContextMatrix,
  PaginationInfo,
  RequestSortDirection,
  ResponseError,
  useCollection
} from "@upmind-automation/headless";
import type {
  IOrder,
  IPaymentDetail,
  InvoiceStatus
} from "@upmind-automation/types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// SCOPE — two matrices, one per composable
// -----------------------------------------------------------------------------

/** Context types for the order COLLECTION — whose orders are read. */
export const ClientOrdersContextTypes = {
  /** Reading a client's own order collection. */
  CLIENT: AccessRoleTypes.CLIENT
} as const;

export type ClientOrdersContextTypes =
  (typeof ClientOrdersContextTypes)[keyof typeof ClientOrdersContextTypes];

/**
 * Scope matrix for `useClientOrders`. `client` is the only actor that
 * resolves; the portal mock has no staff or guest surface (plan §6).
 */
export const CLIENT_ORDERS_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientOrdersContextTypes.CLIENT,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientOrders` (derived from the runtime const). */
export type ClientOrdersScopeMatrix = typeof CLIENT_ORDERS_SCOPE_MATRIX;

/** Context types for the per-order MANAGER — which order is addressed. */
export const ClientOrderContextTypes = {
  /** Acting on one existing order by id. */
  ORDER: "order"
} as const;

export type ClientOrderContextTypes =
  (typeof ClientOrderContextTypes)[keyof typeof ClientOrderContextTypes];

/** Scope matrix for `useClientOrder`. Separate from the collection's. */
export const CLIENT_ORDER_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientOrderContextTypes.ORDER,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientOrder` (derived from the runtime const). */
export type ClientOrderScopeMatrix = typeof CLIENT_ORDER_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// SORTING
// -----------------------------------------------------------------------------

/**
 * Wire columns the order list can be sorted by. The gap doc records that
 * legacy sorts orders without itemising the set, so these mirror the invoice
 * list's — the same wire document.
 */
export const ClientOrdersSortableProperties = {
  DEFAULT: "created_at",
  DATE_CREATED: "created_at",
  STATUS: "status_id",
  TOTAL: "total_amount"
} as const;

export type ClientOrdersSortableProperties =
  (typeof ClientOrdersSortableProperties)[keyof typeof ClientOrdersSortableProperties];

// -----------------------------------------------------------------------------
// FILTERS
// -----------------------------------------------------------------------------

/** The collection's named filters — an absent value clears that key. */
export type ClientOrdersFilters = {
  /** Free-text narrowing — the listing's quick search. */
  query: (value?: string) => void;
  /** Narrows to one order status. */
  status: (value?: InvoiceStatus) => void;
  /** Narrows by creation date. */
  dateCreated: (value?: IOrder["created_at"]) => void;
  /**
   * Narrows by the day the order was paid (`order.ts:63-68`, `paid_datetime`).
   *
   * @decision Typed `string` rather than off `IOrder`: `IOrder` aliases
   * `IInvoice`, which carries no `paid_datetime` — legacy filtered a BASKET
   * field the order model does not publish.
   */
  datePaid: (value?: string) => void;
  /**
   * Narrows to the orders holding an item provisioned under this identifier
   * (`order.ts:105-111`, `products.service_identifier`, CONTAINS).
   */
  serviceIdentifier: (value?: string) => void;
  /**
   * Narrows to the orders holding an item from this catalogue category. Legacy
   * published TWO: a category-name filter for the client and a category-id
   * picker for the desk (`order.ts:90-104`). This is the client's.
   */
  categoryName: (value?: string) => void;
};

// -----------------------------------------------------------------------------
// LAYERS — useClientOrders (collection)
// -----------------------------------------------------------------------------

/** Collection context — the reactive page of orders and its lookups. */
export type UseClientOrdersContext = {
  /** The reactive current page of this scope's orders (always an array). */
  data: ComputedRef<IOrder[]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** Finds one order on the page by a partial mapping. */
  findOne: ReturnType<typeof useCollection<IOrder>>["findOne"];
  /** Finds one order on the page by id. */
  getOne: ReturnType<typeof useCollection<IOrder>>["getOne"];
  /** Reactive pagination descriptor for the collection. */
  pagination: ComputedRef<PaginationInfo>;
};

/** Collection meta — one computed per state flag. */
export type UseClientOrdersMeta = {
  /** True if the list query failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True if this scope has no orders. */
  isEmpty: ComputedRef<boolean>;
  /** True while the list is loading or has not completed its first fetch. */
  isLoading: ComputedRef<boolean>;
  /** True while there is a further page beyond the current one. */
  hasNextPage: ComputedRef<boolean>;
  /** True while there is a page before the current one. */
  hasPrevPage: ComputedRef<boolean>;
  /** True while the list spans more than one page. */
  hasPages: ComputedRef<boolean>;
};

/** Collection actions — list controls and lifecycle. */
export type UseClientOrdersActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Filters for the list query. */
  filters: ClientOrdersFilters;
  /** Marks the shared cache key stale so the next read refetches. */
  invalidate: <T>(data?: T) => Promise<T | undefined>;
  /** Resolves true when the collection is ready to read. Always settles. */
  isReady: () => Promise<boolean>;
  /** Fetches the next page. */
  nextPage: () => void;
  /** Fetches the previous page. */
  prevPage: () => void;
  /** Refetches the list from the server. */
  refresh: () => Promise<void>;
  /** Sorts the list by the given property and direction. */
  sort: (
    property?: ClientOrdersSortableProperties,
    direction?: RequestSortDirection
  ) => void;
};

/** Collection internals (debugging) — exempt from conformance. */
export type UseClientOrdersInternals = ContractInternals;

// -----------------------------------------------------------------------------
// LAYERS — useClientOrder (manager)
// -----------------------------------------------------------------------------

/** Manager context — the addressed order and its invoices. */
export type UseClientOrderContext = {
  /** The order this scope resolved. */
  data: ComputedRef<IOrder | undefined>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** The line items this order was placed for. */
  products: ComputedRef<IOrder["products"]>;
};

/** Manager meta — one computed per state flag. */
export type UseClientOrderMeta = {
  /** True if the read or a mutation failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True once the first read has completed, regardless of outcome. */
  isComplete: ComputedRef<boolean>;
  /** True if this scope resolved no order. */
  isEmpty: ComputedRef<boolean>;
  /** True while the read is loading or has not completed its first fetch. */
  isLoading: ComputedRef<boolean>;
  /** True while a mutation is in flight. */
  isProcessing: ComputedRef<boolean>;
  /** True once the order is settled in full. */
  isPaid: ComputedRef<boolean>;
  /** True once the order has been cancelled. */
  isCancelled: ComputedRef<boolean>;
  /** True while the client may still cancel this order. */
  canCancel: ComputedRef<boolean>;
};

/** Manager actions — the order's own capabilities plus lifecycle. */
export type UseClientOrderActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Marks the shared cache key stale so the next read refetches. */
  invalidate: <T>(data?: T) => Promise<T | undefined>;
  /** Resolves true when the order is ready to read. Always settles. */
  isReady: () => Promise<boolean>;
  /** Refetches the order from the server. */
  refresh: () => Promise<void>;
  /** Cancels the order and the invoices raised for it. */
  cancel: () => Promise<void>;
  /**
   * Settles the invoice this order still owes — legacy's order-level Pay,
   * which handed the order straight to the invoice CTA
   * (`orderSummary.vue:36`, `:invoice="order"`).
   */
  pay: (paymentDetailId?: IPaymentDetail["id"]) => Promise<void>;
};

/** Manager internals (debugging) — exempt from conformance. */
export type UseClientOrderInternals = ContractInternals;
