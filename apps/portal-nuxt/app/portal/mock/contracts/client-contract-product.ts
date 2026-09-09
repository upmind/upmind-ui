// -----------------------------------------------------------------------------
/**
 * @module portal/mock/contracts/client-contract-product
 * @description Four-layer contract for the per-product manager headless does
 * not have yet (plan §3): `useClientContractProduct` — the subscription
 * lifecycle (trial, auto-renew, cancellation, migration, billing settings) —
 * and `useContractProductScheduledActions`, the automation timeline behind it.
 * Models are the wire `IContractProduct`, `IContractCancellationRequest`,
 * `IContractProductScheduledCancellation` and `IScheduledAction`.
 *
 * @oracle vue-app `origin/master` @ `7f259e0e12`, client area —
 * `cProdProvider.vue`, `clientContractCancellationModal.vue`,
 * `cProdAutoRenewMsg.vue`, `cProdTimeline.vue`; gap-doc rows "2. Products →
 * Detail / Billing tab / Settings tab", X6.
 */

import { CancelOptions } from "@upmind-automation/types";
import { NO_ACTOR_CONTEXT, SCOPE_ACTOR } from "./scope";
import type { ContractInternals } from "./scope";
import type {
  ActorContextMatrix,
  CustomField,
  CustomFieldModel,
  PaginationInfo,
  PaymentDetail,
  RequestSortDirection,
  ResponseError,
  useCollection
} from "@upmind-automation/headless";
import type {
  IAddress,
  IContractCancellationRequest,
  IContractProduct,
  IContractProductScheduledCancellation,
  InvoiceConsolidationTypes,
  IScheduledAction,
  ScheduledActionStatusTypes
} from "@upmind-automation/types";
import type { ComputedRef } from "vue";

// -----------------------------------------------------------------------------
// MODELS
// -----------------------------------------------------------------------------

/**
 * When a client asks a product to stop.
 *
 * @decision `CancelOptions` carries the two the platform names — its third
 * member, `ABORT`, is the don't-cancel verb rather than a request — so
 * SCHEDULED is declared here. Legacy offers a date as its own choice, and no
 * platform enum carries it; the status it lodges,
 * `CancellationRequestStatusCodes.REQUEST_SCHEDULED_FUTURE_CANCELLATION`,
 * does exist, which is what makes the gap this fills a naming one.
 */
export const CANCEL_OPTION = {
  END_OF_BILLING_CYCLE: CancelOptions.SOFT,
  IMMEDIATELY: CancelOptions.HARD,
  SCHEDULED: "scheduled"
} as const;

export type ContractCancelOption =
  (typeof CANCEL_OPTION)[keyof typeof CANCEL_OPTION];

/** What the cancellation form is handed — the choices this product allows, and the brand's questions. */
export type CancellationContext = {
  /** The options the brand and this product between them allow. */
  options: readonly ContractCancelOption[];
  /** The brand's own questions asked at cancellation. */
  fields: readonly CustomField[];
  /** What the form calls the product it is about — the warning names it. */
  productName: string;
  /** The contract has not started yet, so stopping it now takes nothing away. */
  isPending: boolean;
};

/** What the cancellation form writes. */
export type CancellationRequestModel = {
  option: ContractCancelOption;
  /** The day it stops (ISO date); asked for by the scheduled choice alone. */
  cancelAt?: IContractProductScheduledCancellation["future_cancellation_date"];
  reason: IContractCancellationRequest["reason"];
  /** The answers to the brand's own questions. */
  customFields?: CustomFieldModel;
};

// -----------------------------------------------------------------------------
// SCOPE — two matrices, one per composable
// -----------------------------------------------------------------------------

/** Context types for the product MANAGER — which product is addressed. */
export const ClientContractProductContextTypes = {
  /** Acting on one existing contract product by id. */
  CONTRACT_PRODUCT: "contract-product"
} as const;

export type ClientContractProductContextTypes =
  (typeof ClientContractProductContextTypes)[keyof typeof ClientContractProductContextTypes];

/**
 * Scope matrix for `useClientContractProduct`. `client` is the only actor
 * that resolves; the portal mock has no staff or guest surface (plan §6).
 */
export const CLIENT_CONTRACT_PRODUCT_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]: ClientContractProductContextTypes.CONTRACT_PRODUCT,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useClientContractProduct`. */
export type ClientContractProductScopeMatrix =
  typeof CLIENT_CONTRACT_PRODUCT_SCOPE_MATRIX;

/** Context types for the scheduled-action COLLECTION — whose timeline is read. */
export const ContractProductScheduledActionsContextTypes = {
  /** Reading one product's scheduled billing actions. */
  CONTRACT_PRODUCT: "contract-product"
} as const;

export type ContractProductScheduledActionsContextTypes =
  (typeof ContractProductScheduledActionsContextTypes)[keyof typeof ContractProductScheduledActionsContextTypes];

/** Scope matrix for `useContractProductScheduledActions`. */
export const CONTRACT_PRODUCT_SCHEDULED_ACTIONS_SCOPE_MATRIX = {
  [SCOPE_ACTOR.SELF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.STAFF]: NO_ACTOR_CONTEXT,
  [SCOPE_ACTOR.CLIENT]:
    ContractProductScheduledActionsContextTypes.CONTRACT_PRODUCT,
  [SCOPE_ACTOR.GUEST]: NO_ACTOR_CONTEXT
} as const satisfies ActorContextMatrix;

/** Scope matrix type for `useContractProductScheduledActions`. */
export type ContractProductScheduledActionsScopeMatrix =
  typeof CONTRACT_PRODUCT_SCHEDULED_ACTIONS_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// SORTING
// -----------------------------------------------------------------------------

/** Wire columns the timeline can be sorted by. */
export const ContractProductScheduledActionsSortableProperties = {
  DEFAULT: "created_at",
  DATE_EXECUTED: "executed_at"
} as const;

export type ContractProductScheduledActionsSortableProperties =
  (typeof ContractProductScheduledActionsSortableProperties)[keyof typeof ContractProductScheduledActionsSortableProperties];

// -----------------------------------------------------------------------------
// FILTERS
// -----------------------------------------------------------------------------

/** The timeline collection's named filters. */
export type ContractProductScheduledActionsFilters = {
  /** Narrows to one scheduled-action outcome. */
  status: (value?: ScheduledActionStatusTypes) => void;
};

// -----------------------------------------------------------------------------
// LAYERS — useClientContractProduct (manager)
// -----------------------------------------------------------------------------

/** Manager context — the product and the lifecycle records attached to it. */
export type UseClientContractProductContext = {
  /** The contract product this scope resolved. */
  data: ComputedRef<IContractProduct | undefined>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** The pending or accepted cancellation request, when one exists. */
  cancellationRequest: ComputedRef<IContractCancellationRequest | undefined>;
  /** The scheduled future cancellation, when one exists. */
  scheduledCancellation: ComputedRef<
    IContractProductScheduledCancellation | undefined
  >;
  /** The products this one may be migrated to. */
  allowedMigrations: ComputedRef<IContractProduct["allowed_migrations"]>;
};

/** Manager meta — one computed per state flag. */
export type UseClientContractProductMeta = {
  /** True if the read or a mutation failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True once the first read has completed, regardless of outcome. */
  isComplete: ComputedRef<boolean>;
  /** True if this scope resolved no product. */
  isEmpty: ComputedRef<boolean>;
  /** True while the read is loading or has not completed its first fetch. */
  isLoading: ComputedRef<boolean>;
  /** True while a mutation is in flight. */
  isProcessing: ComputedRef<boolean>;
  /** True while the product is inside its free trial. */
  isInTrial: ComputedRef<boolean>;
  /** True while the product is suspended. */
  isSuspended: ComputedRef<boolean>;
  /** True while the product renews itself. */
  isAutoRenew: ComputedRef<boolean>;
  /** True while setup fields are still awaiting confirmation. */
  needsSetup: ComputedRef<boolean>;
  /** True while a cancellation request is outstanding. */
  hasPendingCancellation: ComputedRef<boolean>;
  /** True while the product is scheduled to expire on a date. */
  hasScheduledCancellation: ComputedRef<boolean>;
  /** True while a pro-rata change is pending — the legacy warning. */
  hasPendingProRata: ComputedRef<boolean>;
  /** True while unpaid recurring invoices block the lifecycle actions. */
  hasUnpaidInvoices: ComputedRef<boolean>;
  /** True while the client may cancel the product. */
  canCancel: ComputedRef<boolean>;
  /** True while the next renewal invoice can be raised early. */
  canCreateRenewalInvoice: ComputedRef<boolean>;
  /** True while the product may be migrated. */
  canMigrate: ComputedRef<boolean>;
};

/** Manager actions — the product's own capabilities plus lifecycle. */
export type UseClientContractProductActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Marks the shared cache key stale so the next read refetches. */
  invalidate: <T>(data?: T) => Promise<T | undefined>;
  /** Resolves true when the product is ready to read. Always settles. */
  isReady: () => Promise<boolean>;
  /** Refetches the product from the server. */
  refresh: () => Promise<void>;
  /** Confirms the setup fields, completing provisioning. */
  completeSetup: () => Promise<void>;
  /** Ends the free trial immediately. */
  endTrial: () => Promise<void>;
  /** Turns automatic renewal on or off. */
  setAutoRenew: (value: IContractProduct["renew"]) => Promise<void>;
  /** Withdraws an outstanding cancellation request. */
  abortCancellation: () => Promise<void>;
  /** Clears a scheduled future expiry. */
  disableAutoExpire: () => Promise<void>;
  /** Raises the next renewal invoice now. */
  createRenewalInvoice: () => Promise<void>;
  /** Migrates the product onto another catalogue product. */
  migrate: (targetProductId: IContractProduct["product_id"]) => Promise<void>;
  /** Points the product's billing at a stored payment method. */
  setPaymentDetail: (paymentDetailId: PaymentDetail["id"]) => Promise<void>;
  /** Points the product's billing at one of the client's addresses. */
  setBillingAddress: (addressId: IAddress["id"]) => Promise<void>;
  /** Sets whether this product's invoices join the account's consolidated one. */
  setConsolidation: (value: InvoiceConsolidationTypes) => Promise<void>;
  /** Sets the client's own name for this product; an empty label clears it. */
  setLabel: (label: IContractProduct["name"]) => Promise<void>;
  /** Lodges a cancellation request against this product. */
  requestCancellation: (model: CancellationRequestModel) => Promise<void>;
};

/** Manager internals (debugging) — exempt from conformance. */
export type UseClientContractProductInternals = ContractInternals;

// -----------------------------------------------------------------------------
// LAYERS — useContractProductScheduledActions (collection)
// -----------------------------------------------------------------------------

/** Collection context — the reactive page of scheduled actions. */
export type UseContractProductScheduledActionsContext = {
  /** The reactive current page of this product's scheduled actions. */
  data: ComputedRef<IScheduledAction[]>;
  /** The scope's captured error — read, never raised. */
  error: ComputedRef<ResponseError | undefined>;
  /** Finds one scheduled action on the page by a partial mapping. */
  findOne: ReturnType<typeof useCollection<IScheduledAction>>["findOne"];
  /** Finds one scheduled action on the page by id. */
  getOne: ReturnType<typeof useCollection<IScheduledAction>>["getOne"];
  /** Reactive pagination descriptor for the collection. */
  pagination: ComputedRef<PaginationInfo>;
};

/** Collection meta — one computed per state flag. */
export type UseContractProductScheduledActionsMeta = {
  /** True if the list query failed. */
  hasError: ComputedRef<boolean>;
  /** True while this scope can address a client. */
  isAvailable: ComputedRef<boolean>;
  /** True if this product has no scheduled actions. */
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
export type UseContractProductScheduledActionsActions = {
  /** Destroys this scoped instance — removes it from the registry. */
  destroy: () => void;
  /** Filters for the list query. */
  filters: ContractProductScheduledActionsFilters;
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
    property?: ContractProductScheduledActionsSortableProperties,
    direction?: RequestSortDirection
  ) => void;
};

/** Collection internals (debugging) — exempt from conformance. */
export type UseContractProductScheduledActionsInternals = ContractInternals;
