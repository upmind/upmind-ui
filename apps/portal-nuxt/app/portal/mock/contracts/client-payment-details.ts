// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-payment-details
 * @description Four-layer contract for the SCOPED `client-payment-details`
 * module headless does not have yet (plan §3) — the existing
 * `usePaymentDetails` is checkout-shaped. Rows are the headless
 * `PaymentDetail` model, so nothing is minted here.
 *
 * @oracle vue-app `origin/master` @ `7f259e0e12`, client area — the payment
 * methods listing (display name, gateway, auto-payment and unverified tags),
 * set default, allow auto-payment, delete with confirmation; gap-doc rows
 * "3. Billing → Payment methods", X3.
 */

import { AccessRoleTypes } from "@upmind-automation/types";
import { NO_ACTOR_CONTEXT, SCOPE_ACTOR } from "./scope";
import type { ContractInternals } from "./scope";
import type {
  ActorContextMatrix,
  PaginationInfo,
  PaymentDetail,
  RequestSortDirection,
  ResponseError,
  useCollection
} from "@upmind-automation/headless";
import type {
  IGateway,
  IPaymentDetail,
  PaymentMethodType
} from "@upmind-automation/types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/**
 * What the add-card form writes — the gateway it is stored through and the
 * card itself, in the wire's own `IPaymentDetail` spelling.
 *
 * @decision Portal-local. `PaymentDetailData` is the checkout module's own
 * request bag (an amount, a return url, an order); storing a method outside a
 * payment has no wire request model of its own.
 */
export type PaymentDetailCreateModel = {
  gateway_id: IGateway["id"];
  card_num: IPaymentDetail["card_num"];
  card_expire_date: IPaymentDetail["card_expire_date"];
  card_cvv: IPaymentDetail["card_cvv"];
};

// -----------------------------------------------------------------------------
// SCOPE — two matrices, one per composable
// -----------------------------------------------------------------------------

/** Context types for the payment-method COLLECTION — whose methods are read. */
export const ClientPaymentDetailsContextTypes = {
  /** Reading a client's own stored payment methods. */
  CLIENT: AccessRoleTypes.CLIENT
} as const;

export type ClientPaymentDetailsContextTypes =
  (typeof ClientPaymentDetailsContextTypes)[keyof typeof ClientPaymentDetailsContextTypes];

/**
 * Scope matrix for `useClientPaymentDetails`. `client` is the only actor that
 * resolves; the portal mock has no staff or guest surface (plan §6).
 */
export const CLIENT_PAYMENT_DETAILS_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientPaymentDetailsContextTypes.CLIENT,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientPaymentDetails`. */
export type ClientPaymentDetailsScopeMatrix =
  typeof CLIENT_PAYMENT_DETAILS_SCOPE_MATRIX;

/** Context types for the per-method MANAGER — which method is addressed. */
export const ClientPaymentDetailContextTypes = {
  /** Acting on one existing payment method by id. */
  PAYMENT_DETAIL: "payment-detail"
} as const;

export type ClientPaymentDetailContextTypes =
  (typeof ClientPaymentDetailContextTypes)[keyof typeof ClientPaymentDetailContextTypes];

/** Scope matrix for `useClientPaymentDetail`. Separate from the collection's. */
export const CLIENT_PAYMENT_DETAIL_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientPaymentDetailContextTypes.PAYMENT_DETAIL,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientPaymentDetail`. */
export type ClientPaymentDetailScopeMatrix =
  typeof CLIENT_PAYMENT_DETAIL_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// SORTING
// -----------------------------------------------------------------------------

/**
 * Wire columns the payment-method list can be sorted by. Legacy offers no
 * sort control here; `DEFAULT` is the stored order the list opens in.
 */
export const ClientPaymentDetailsSortableProperties = {
  DEFAULT: "created_at"
} as const;

export type ClientPaymentDetailsSortableProperties =
  (typeof ClientPaymentDetailsSortableProperties)[keyof typeof ClientPaymentDetailsSortableProperties];

// -----------------------------------------------------------------------------
// FILTERS
// -----------------------------------------------------------------------------

/**
 * The collection's named filters. Legacy filters this list on nothing — the
 * gateway type is the one narrowing the pickers need (invoice pay step).
 */
export type ClientPaymentDetailsFilters = {
  /** Narrows to one stored method type. */
  type: (value?: PaymentMethodType) => void;
};

// -----------------------------------------------------------------------------
// LAYERS — useClientPaymentDetails (collection)
// -----------------------------------------------------------------------------

/** Collection context — the reactive page of stored methods and its lookups. */
export type UseClientPaymentDetailsContext = {
  /** The reactive current page of this scope's methods (always an array). */
  data: ComputedRef<PaymentDetail[]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** Finds one method on the page by a partial mapping. */
  findOne: ReturnType<typeof useCollection<PaymentDetail>>["findOne"];
  /** Finds one method on the page by id. */
  getOne: ReturnType<typeof useCollection<PaymentDetail>>["getOne"];
  /** Reactive pagination descriptor for the collection. */
  pagination: ComputedRef<PaginationInfo>;
};

/** Collection meta — one computed per state flag. */
export type UseClientPaymentDetailsMeta = {
  /** True if the list query failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True if this scope has no stored methods. */
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
export type UseClientPaymentDetailsActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Filters for the list query. */
  filters: ClientPaymentDetailsFilters;
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
    property?: ClientPaymentDetailsSortableProperties,
    direction?: RequestSortDirection
  ) => void;
  /** Stores one more method against the client, through the chosen gateway. */
  create: (model: PaymentDetailCreateModel) => Promise<void>;
};

/** Collection internals (debugging) — exempt from conformance. */
export type UseClientPaymentDetailsInternals = ContractInternals;

// -----------------------------------------------------------------------------
// LAYERS — useClientPaymentDetail (manager)
// -----------------------------------------------------------------------------

/** Manager context — the addressed payment method. */
export type UseClientPaymentDetailContext = {
  /** The payment method this scope resolved. */
  data: ComputedRef<PaymentDetail | undefined>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
};

/** Manager meta — one computed per state flag. */
export type UseClientPaymentDetailMeta = {
  /** True if the read or a mutation failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True once the first read has completed, regardless of outcome. */
  isComplete: ComputedRef<boolean>;
  /** True if this scope resolved no method. */
  isEmpty: ComputedRef<boolean>;
  /** True while the read is loading or has not completed its first fetch. */
  isLoading: ComputedRef<boolean>;
  /** True while a mutation is in flight. */
  isProcessing: ComputedRef<boolean>;
  /** True while this is the client's default method. */
  isDefault: ComputedRef<boolean>;
  /** True while this method settles invoices automatically. */
  isAutoPayment: ComputedRef<boolean>;
  /** True while the gateway has verified the stored method. */
  isVerified: ComputedRef<boolean>;
  /** True while the method may be removed. */
  canRemove: ComputedRef<boolean>;
};

/** Manager actions — the method's own capabilities plus lifecycle. */
export type UseClientPaymentDetailActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Marks the shared cache key stale so the next read refetches. */
  invalidate: <T>(data?: T) => Promise<T | undefined>;
  /** Resolves true when the method is ready to read. Always settles. */
  isReady: () => Promise<boolean>;
  /** Refetches the method from the server. */
  refresh: () => Promise<void>;
  /** Makes this the client's default payment method. */
  setDefault: () => Promise<void>;
  /** Turns automatic settlement on or off for this method. */
  setAutoPayment: (
    value: PaymentDetail["meta"]["isAutoPayment"]
  ) => Promise<void>;
  /** Removes the stored method. */
  remove: () => Promise<void>;
  /** Renames the stored method to the client's own label for it. */
  rename: (displayName: PaymentDetail["name"]) => Promise<void>;
  /** Asks the gateway to confirm an unverified stored method again. */
  verify: () => Promise<void>;
};

/** Manager internals (debugging) — exempt from conformance. */
export type UseClientPaymentDetailInternals = ContractInternals;
