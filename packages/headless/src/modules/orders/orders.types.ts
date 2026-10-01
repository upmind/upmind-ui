import { SortDirection } from "../query/query.types";
import { ScopeActorTypes } from "../scope/scope.types";
import type { ResponseError } from "../../utils";
import type { ListQuery, SimpleQuery } from "../query";
import type { QueryKey } from "@tanstack/vue-query";
import type {
  IBillingCycle,
  IBrand,
  IClient,
  IContract,
  IContractProduct,
  IOrder
} from "@upmind-automation/types";
import type { ComputedRef, Ref } from "vue";
// -----------------------------------------------------------------------------
/**
 * @module orders/orders.types
 * @description Types for the client order-history collection
 * (`useOrders`) — a client's own placed orders (`new_contract`
 * invoices), scoped `client x self` only (FE-3237 Out of Scope). The module
 * has no delegated entity the oracle names
 * (`docs/sdd/FE-3237/parity.yaml`), so it mints NO context enum —
 * `templates/SINGLE-READ.md`'s "do not mint a context type to fill the
 * slot" — and its matrix refuses every `.for()` cell (design 5.2 [h15]).
 *
 * @decision
 * what: type names below (`OrdersCollectionScopeMatrix`,
 * `OrdersFilterActions`, `OrdersSortableColumn`) depart from
 * design.md 5.2's literal names (`OrdersScopeMatrix`,
 * `OrdersFilters`, `OrdersSortableProperties`). The same
 * collision, same reason, applies to each layer file's derived
 * `UseOrdersCollection<Layer>` export (`useOrders.actions.ts` /
 * `.context.ts` / `.meta.ts` / `.internals.ts`) — the mock declares
 * `UseOrders<Layer>` by hand for all four.
 * why: `hooks/graphify-gate.sh` (U12) denies those three names outright —
 * `apps/portal-nuxt/app/portal/mock/contracts/client-orders.ts` already
 * exports them, as the portal's stand-in CONTRACT for this module ahead of
 * its build (design 8.6's "mock contract" [m1]). A genuinely different
 * concept (a real query-backed implementation vs. an app-level mock
 * stub) in a different package, so this is not a true duplicate — but the
 * gate is unconditional ("a retry with the same name is denied again") and
 * `apps/portal-nuxt` is outside this story's file set. Retiring or
 * reconciling that mock is a separate, unscoped decision — flagged in this
 * build's hand-off, not resolved here.
 * rejected: importing the mock's types into headless (wrong dependency
 * direction — an app package into a leaf package); silently renaming with
 * no record (the FE-3237 design's own names would then read as unexplained
 * drift to the next reader).
 */

// -----------------------------------------------------------------------------
// SCOPE — no context enum: the oracle names no delegated entity for this
// actor (design 5.2, 8.6 row "collection matrix"; `templates/SINGLE-READ.md`).
// -----------------------------------------------------------------------------

/**
 * Scope matrix for `useOrders`. Every `.for()` cell is `null as
 * never` — `.as('self')` still resolves through the scope builder; this
 * withdraws retargeting only (design 8.6, FE-3237 Out of Scope: no
 * `.for('client', id)`).
 */
export const ORDERS_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: null as never,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useOrders` (derived from the runtime const). */
export type OrdersCollectionScopeMatrix = typeof ORDERS_SCOPE_MATRIX;

/**
 * Scope matrix for `useOrder` (the single-order manager). The order
 * being read is a RECORD ID (`.withId(id)`), never a scope context — there
 * is no actor-context cell to declare, so every `.for()` cell here is `null
 * as never` too (design 5.2, the `useClientReceivedEmail` precedent).
 */
export const ORDER_MANAGER_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: null as never,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useOrder` (derived from the runtime const). */
export type OrderManagerScopeMatrix = typeof ORDER_MANAGER_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// SORTING
// -----------------------------------------------------------------------------

/** The whole sortable vocabulary (ruling R2 — keeps `id`, no `DEFAULT` member). */
export enum OrdersSortableColumn {
  ID = "id",
  TOTAL_AMOUNT = "total_amount",
  STATUS_ID = "status_id",
  CREATED_AT = "created_at"
}

/** One sort entry — the model's ordered form; precedence is position. */
export type OrdersSortEntry = {
  field: OrdersSortableColumn;
  dir: SortDirection;
};

/** The boot order — `order=-created_at` (design 8.3). */
export const ORDERS_DEFAULT_SORT: OrdersSortEntry[] = [
  { field: OrdersSortableColumn.CREATED_AT, dir: SortDirection.DESC }
];

// -----------------------------------------------------------------------------
// QUERY MODEL — the whole request state, owned by ONE schema (design 8.3)
// -----------------------------------------------------------------------------

/**
 * The five status choices the `status.code` filter offers (design 8.3, F15).
 * Unpaid is ONE choice carrying TWO legacy statuses — `invoice_unpaid` and
 * `invoice_adjusted` — sent as the single csv-joined wire value below, never
 * as two enum values.
 */
export type OrderStatusChoice =
  | "invoice_paid"
  | "invoice_unpaid,invoice_adjusted"
  | "invoice_overdue"
  | "invoice_cancelled"
  | "invoice_refunded";

/** A relative date value, e.g. `-7_days` / `+7_days` (design 8.3). */
export type RelativeDateValue = string;

/** An absolute date value, e.g. `2026-09-01 00:00:00` (design 8.3). */
export type AbsoluteDateValue = string;

/** The comparison operators a many-comparison numeric column accepts. */
export type OrdersComparisonLeaf<TValue> = {
  eq?: TValue;
  neq?: TValue;
  gt?: TValue;
  gte?: TValue;
  lt?: TValue;
  lte?: TValue;
};

/** The date column's comparison leaf — the two date-value domains (design 8.3). */
export type OrdersDateLeaf = {
  gt?: AbsoluteDateValue;
  gte?: AbsoluteDateValue;
  lt?: AbsoluteDateValue;
  lte?: AbsoluteDateValue;
  after?: RelativeDateValue;
  before?: RelativeDateValue;
};

/**
 * The whole request state as one model — `filters` (nested column ->
 * operator -> value), `sort` (ordered) and `pagination`. Every property
 * name is the wire column, held as a literal dotted key (design 8.3 [h7]).
 * The instance is validated against `useQuerySchema()`; `list()`'s
 * translator maps it to the wire triple.
 */
export type OrdersQueryModel = {
  filters?: {
    /** Forced — `const: "new_contract"`, no control (design 8.3, D-3). */
    "category.slug"?: "new_contract";
    /** Text + the search. The search writes `eq` (design 8.3). */
    number?: { like?: string; eq?: string; neq?: string };
    total_amount?: OrdersComparisonLeaf<number>;
    /** `maxProperties: 1` — `eq`/`neq` never together (design 8.3, D-24). */
    "status.code"?: {
      eq?: OrderStatusChoice[];
      neq?: OrderStatusChoice[];
    };
    created_at?: OrdersDateLeaf;
    paid_datetime?: OrdersDateLeaf;
    "products.product.name"?: { like?: string; eq?: string; neq?: string };
    "products.product.category.name"?: {
      like?: string;
      eq?: string;
      neq?: string;
    };
    "products.service_identifier"?: {
      like?: string;
      eq?: string;
      neq?: string;
    };
  };
  sort?: OrdersSortEntry[];
  pagination?: { limit?: number; offset?: number };
};

/** The nested filter model — the `filters` branch of {@link OrdersQueryModel}. */
export type OrdersFilterModel = NonNullable<OrdersQueryModel["filters"]>;

/** The ordered sort model — the `sort` branch of {@link OrdersQueryModel}. */
export type OrdersSortModel = NonNullable<OrdersQueryModel["sort"]>;

/**
 * The named setters object AC7-AC12 name (design 5.2 `OrdersFilters`
 * — renamed here per this file's head `@decision`). Each setter composes a
 * fresh copy of the live `filters` with its one leaf changed (design 8.3
 * write rules, D-7).
 */
export type OrdersFilterActions = {
  query: (term?: string) => void;
  status: (values?: OrderStatusChoice[], op?: "eq" | "neq") => void;
  total: (value?: number, op?: keyof OrdersComparisonLeaf<number>) => void;
  dateCreated: (
    value?: RelativeDateValue | AbsoluteDateValue,
    op?: keyof OrdersDateLeaf
  ) => void;
  datePaid: (
    value?: RelativeDateValue | AbsoluteDateValue,
    op?: keyof OrdersDateLeaf
  ) => void;
  itemName: (value?: string, op?: "like" | "eq" | "neq") => void;
  categoryName: (value?: string, op?: "like" | "eq" | "neq") => void;
  serviceIdentifier: (value?: string, op?: "like" | "eq" | "neq") => void;
};

// -----------------------------------------------------------------------------
// SERVICE-LAYER SHAPES
// -----------------------------------------------------------------------------

/**
 * The reactive list query, minted ONCE per scope in `useOrders.ts`.
 * Aliased from the query platform's own `ListQuery` — never derived with
 * `ReturnType<typeof localServiceFn>`.
 */
export type OrdersListQuery = ListQuery<IOrder[], IOrder[], OrdersQueryModel>;

/**
 * The contract `createOrdersServices` resolves to — the ONE services
 * file both `useOrders` (the collection) and `useOrder` (the
 * manager) consume, so the two composables can never disagree about whose
 * order history, or which order, is being read. Armless (clause 2 — one
 * actor, `client`, resolves; no second actor has an exclusive or overriding
 * member, so no `.{actor}.ts` arm is earned).
 */
export type OrdersServices = {
  /** The module's base cache key (design 8.4, D-4 — under the `invoices` root). */
  queryKey: QueryKey;
  /**
   * The reactive form of the ONE addressability predicate `loadList`'s guard
   * and `enabled` both call. The composable layers read THIS rather than
   * re-deriving the expression, so the flag a consumer renders and the gate
   * the wire enforces cannot drift apart.
   */
  isAvailable: ComputedRef<boolean>;
  /** Always `undefined` — no services-level error state beyond the query's own. */
  error: ComputedRef<ResponseError | undefined>;
  /** Takes nothing: the request state is the declared query schema. */
  loadList: () => OrdersListQuery;
  /** The single-order read — `GET api/invoices/{id}` (design 8.1). */
  loadOne: (id?: IOrder["id"]) => OrderItemQuery;
  /**
   * The item-catalogue-image read — `GET api/products` (design 8.1, D-14).
   * Reactive over the LIVE snapshot product ids, because they resolve only
   * once the single read settles.
   */
  loadItemImages: (productIds: Ref<string[]>) => OrderItemImagesQuery;
  /**
   * The online-gateway count read — `GET api/brands/{id}/gateways` (design
   * 8.1, D-15, D-26). Reactive over the order's own `brand_id`, which
   * resolves only once the single read settles.
   */
  loadOnlineGateways: (brandId: Ref<string | undefined>) => OrderGatewaysQuery;
};

// -----------------------------------------------------------------------------
// MANAGER — the single-order read (design 6.3, 8.1, 8.4 to 8.7)
// -----------------------------------------------------------------------------

/**
 * The reactive single-order item query, minted once per scope. `data` is
 * `undefined` until a record resolves, and on a failed read (design 8.11).
 */
export type OrderItemQuery = Omit<SimpleQuery<IOrder, IOrder>, "data"> & {
  data: ComputedRef<IOrder | undefined>;
};

/**
 * The detail projection `mapOrderDetail` produces (design 8.7). Each field
 * keeps its record name; the client, address and administrator blocks are
 * not published.
 */
export type OrderDetail = {
  id: IOrder["id"] | undefined;
  number: IOrder["number"] | undefined;
  status: IOrder["status"] | undefined;
  totalAmountFormatted: IOrder["total_amount_formatted"] | undefined;
  createdAt: IOrder["created_at"] | undefined;
  paidDatetime: IOrder["paid_datetime"] | undefined;
  dueDate: IOrder["due_date"] | undefined;
  refundChanged: IOrder["refund_changed"] | undefined;
  cancellationDatetime: IOrder["cancellation_datetime"] | undefined;
  cancellationReason: string | undefined;
  notes: IOrder["notes"] | undefined;
  customFields: IOrder["custom_fields"] | undefined;
  contractId: IOrder["contract_id"] | undefined;
  brandId: IOrder["brand_id"] | undefined;
  referrer: IClient | undefined;
};

/** `mapOrderItems`'s resolved cross-cutting inputs (design 8.7, D-14, D-17, D-25). */
export type MapOrderItemsOptions = {
  /** The manager's resolved billing-cycle list (design 6.3, D-25). */
  billingCycles: IBillingCycle[];
  /** The catalogue image map, keyed by `item.product.id` (design 8.1, D-14). */
  imageMap: Record<string, string>;
  /** D-17 — gates `canLink` for a one-time item. */
  hideOneTimePurchases: boolean;
};

/** One quantifiable or non-quantifiable sub-item row (design 8.7 rule 4). */
export type OrderSubItem = {
  id: string;
  name: string;
  quantity: number;
  price: string;
  total: string;
};

/** The item projection `mapOrderItems` produces (design 8.7). */
export type OrderItem = {
  id: string;
  brandId: IBrand["id"] | undefined;
  contractProductId: IContractProduct["id"] | null | undefined;
  contractId: IContract["id"] | null | undefined;
  name: string;
  reference: string;
  period: { from: string; to: string } | undefined;
  quantity: number | undefined;
  price: string | undefined;
  total: string | undefined;
  billingCycleMonths: number;
  isSubscription: boolean;
  billingCycle: IBillingCycle | undefined;
  image: string | undefined;
  tags: unknown[];
  quantifiableItems: OrderSubItem[];
  nonQuantifiableItems: OrderSubItem[];
  hasSubItems: boolean;
  canLink: boolean;
};

/**
 * The injectable cancellation port (D-21). FE-3040 registers the live flow
 * with `provideOrderCancellation`; until then `cancel()` rejects with
 * {@link OrderCancellationUnavailableError} (`orders.errors.ts`).
 */
export type OrderCancellationPort = (
  contractId: IOrder["contract_id"]
) => Promise<void>;

/**
 * The item-catalogue-image read's resolved shape — `GET api/products`
 * (design 8.1, D-14), mapped to a `{ id -> full_url }` map keyed by the
 * linked catalogue product id.
 */
export type OrderItemImagesQuery = SimpleQuery<
  { id: string; image?: { full_url?: string } }[],
  Record<string, string>
>;

/**
 * D-26 — the online-gateway count. Built directly over `useQuery().request`
 * (never `query()`/`list()`, which both drop the response envelope's
 * `total`), so this is its own light reactive shape, not a `SimpleQuery`
 * (no declared criteria schema sits behind this read).
 */
export type OrderGatewaysQuery = {
  data: ComputedRef<number>;
  error: ComputedRef<ResponseError | undefined>;
  isFetched: ComputedRef<boolean>;
  isLoading: ComputedRef<boolean>;
  /** Stops the detached effect scope this read owns; a no-op when it reused an active scope. */
  stop: () => void;
};

/**
 * The manager's cross-cutting resolved state (design 6.3, 8.5, D-16, D-17,
 * D-25) — minted ONCE in `useOrder.ts` and handed to the context,
 * meta and actions layers, so all three read the SAME billing-cycle list,
 * image map, gateway count and cancel-in-flight flag rather than each
 * deriving its own copy.
 */
export type OrderExtras = {
  /** D-25 — the manager's own resolved billing-cycle list. */
  billingCycles: Ref<IBillingCycle[]>;
  /** D-14 — the catalogue image map, keyed by `item.product.id`. */
  imageMap: ComputedRef<Record<string, string>>;
  /** D-15, D-26 — the order brand's online-gateway count `> 0`. */
  hasOnlineGateways: ComputedRef<boolean>;
  /** D-17 — the brand's one-time-purchases visibility rule. */
  hideOneTimePurchases: ComputedRef<boolean>;
  /** True while a `cancel()` call that reached the port is pending (design 8.6). */
  isProcessing: Ref<boolean>;
  /** Stops the online-gateway read's detached effect scope on `destroy()`. */
  stopGatewaysScope: () => void;
};

// The manager's single read and its three delegated reads are members of
// {@link OrdersServices} above — ONE services type for both composables
// (`useClientReceivedEmail`/`useClientReceivedEmails` precedent). No second
// services type is minted here.
