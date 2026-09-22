import { SortDirection } from "../query/query.types";
import { ScopeActorTypes } from "../scope/scope.types";
import { selector } from "../scope/scope.utils";
import type { ResponseError } from "../../utils";
import type { ListQuery } from "../query";
import type { JsonSchema7 } from "@jsonforms/core";
import type { QueryKey } from "@tanstack/vue-query";
import type {
  CancellationRequestStatusCodes,
  ContractStatusCodes,
  IBrand,
  ICProdGroup,
  IClient,
  IContract,
  IContractCancellationRequest,
  IContractProduct,
  IContractProductScheduledCancellation,
  ICustomField,
  IInvoice,
  InvoiceConsolidationTypes,
  IProduct,
  IProductCategory,
  IScheduledAction,
  IStatus,
  ITag,
  TrialEndActionTypes
} from "@upmind-automation/types";
import type { ComputedRef } from "vue";
import type { ActorRef, AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/contract-product.types
 * @description Types for a client's own contract products — the query-backed
 * COLLECTION (`useContractProducts`) and the bespoke-machine MANAGER
 * (`useContractProduct`, `contract-product.machine.ts`). Each composable owns
 * its own context enum and scope matrix; the view model, the query model and
 * the services contract are shared.
 */

// -----------------------------------------------------------------------------
// SCOPE — two matrices, one per composable
// -----------------------------------------------------------------------------

/**
 * Context types for the contract-product COLLECTION. `DELEGATED` is a
 * SELECTOR context with no id: it narrows the same collection to the client's
 * delegated products, it does not name a different entity.
 */
export enum ContractProductsContextTypes {
  /** Narrows the collection to the client's delegated products. */
  DELEGATED = "delegated"
}

/** Scope matrix for `useContractProducts`. `client` is the only actor that resolves. */
export const CONTRACT_PRODUCTS_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: selector(ContractProductsContextTypes.DELEGATED),
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useContractProducts` (derived from the runtime const). */
export type ContractProductsScopeMatrix = typeof CONTRACT_PRODUCTS_SCOPE_MATRIX;

/**
 * Scope matrix for `useContractProduct` — every actor refused.
 *
 * `useContractProduct` is a SINGLE-RECORD READ BY ID (templates/SINGLE-READ.md).
 * The product id rides on `.withId(id)`, never on `.for(type, id)`: the legacy
 * oracle names no entity a client acts on behalf of here, and an absent legacy
 * context is never licence to invent one. Every cell is `never`, so
 * `ContextsForActor` resolves `never` for all four actors and `.for()` is a
 * compile error — the matrix is what makes it unspellable, so it is declared
 * and its TYPE is passed, never dropped.
 */
export const CONTRACT_PRODUCT_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: null as never,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useContractProduct` (derived from the runtime const). */
export type ContractProductScopeMatrix = typeof CONTRACT_PRODUCT_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// VIEW MODEL — the mapping law (design 8.10, R19, R24, R25)
// -----------------------------------------------------------------------------

/** `IStatus.code`, narrowed to the contract vocabulary. */
export type ContractProductStatus = Pick<IStatus, "code"> & {
  code: ContractStatusCodes;
};

/** `IStatus.code`, narrowed to the cancellation-request vocabulary. */
export type ContractProductRequestStatus = Pick<IStatus, "code"> & {
  code: CancellationRequestStatusCodes;
};

/** The `status` member of `IContractCancellationRequest`, narrowed to its code. */
export type ContractProductRequest = {
  [K in keyof Pick<
    IContractCancellationRequest,
    "status"
  >]?: ContractProductRequestStatus;
};

/** The `scheduled_actions` member this module reads. */
export type ScheduledAction = Pick<
  IScheduledAction,
  "id" | "action_code" | "status" | "executed_at" | "created_at"
>;

/** The `unpaid_recurring_invoices` member this module reads. */
export type UnpaidInvoice = Pick<IInvoice, "status">;

/** The `product` relation this module reads (12-member products-list `with`, design 8.1). */
export type ContractProductCatalogueProduct = Pick<
  IProduct,
  "id" | "name" | "image" | "provision_blueprint"
>;

/** The `brand` relation this module reads — `brand.currency` (design 8.1). */
export type ContractProductBrand = Pick<IBrand, "id" | "name" | "currency">;

/** The `tags` relation this module reads. Undeclared on the shared platform
 * `IContractProduct` interface though the wire returns it (verify.md B1);
 * carried here until the shared package catches up. */
export type ContractProductTag = Pick<
  ITag,
  "id" | "name" | "colour" | "show_to_customer"
>;

/** A delegating client, off the `clients` / `moved_to_contract_product.clients` relations. */
export type ContractProductClient = Pick<
  IClient,
  "id" | "fullname" | "email" | "image" | "brand"
>;

/** The `moved_to_contract_product` relation this module reads. */
export type MovedToContractProduct = Pick<
  IContractProduct,
  "id" | "name" | "status"
> & {
  clients?: ContractProductClient[];
};

/** The `future_cancellation_request` relation this module reads. */
export type ContractProductFutureCancellation = Pick<
  IContractProductScheduledCancellation,
  "id" | "future_cancellation_date" | "scheduled_for" | "executed_at"
>;

/**
 * The view model `mapContractProduct` maps `IContractProduct` into — only the
 * fields this module reads, plus the two derived readings every layer shares.
 * The wire record sits beside it on machine context (`rawContractProduct`).
 */
export type ContractProduct = {
  id: IContractProduct["id"];
  contractId: IContractProduct["contract_id"];
  status?: ContractProductStatus;
  stagedImport: IContractProduct["staged_import"];
  contractRequest?: ContractProductRequest;
  renew: IContractProduct["renew"];
  billingCycleMonths: IContractProduct["billing_cycle_months"];
  calculatedCancelDate: IContractProduct["calculated_cancel_date"];
  provisionSetupFieldsConfirmed: IContractProduct["provision_setup_fields_confirmed"];
  inTrial: IContractProduct["in_trial"];
  trialEndAction: TrialEndActionTypes;
  nextDueDate: IContractProduct["next_due_date"];
  importId: IContractProduct["import_id"];
  moved: IContractProduct["moved"];
  name: IContractProduct["name"];
  canCancel: IContractProduct["can_cancel"];
  isDelegatedObject: IContractProduct["is_delegated_object"];
  autoCreateRenewInvoice: IContractProduct["auto_create_renew_invoice"];
  unpaidRecurringInvoices: UnpaidInvoice[];
  scheduledActions?: ScheduledAction[];
  /** `billing_cycle_months > 0` — the product fact, never the criteria leaf (ADR-18). */
  isSubscription: boolean;
  /** `contract_request.status.code === request_scheduled_future_cancellation`. */
  hasScheduledFutureCancellation: boolean;
  /** The catalogue product (`product.image`, `product.provision_blueprint`). */
  product?: ContractProductCatalogueProduct;
  /** That product's brand (`brand.currency`). */
  brand?: ContractProductBrand;
  /** The product's tags. */
  tags?: ContractProductTag[];
  /** Any cancellation scheduled against it for a future date, and its date. */
  futureCancellationRequest?: ContractProductFutureCancellation;
  /** The product it was moved to, when `moved` is true. */
  movedToContractProduct?: MovedToContractProduct;
  /** The client(s) this product is delegated from, on the `DELEGATED` scope. */
  delegatingClients?: ContractProductClient[];
  /** The wire record this view model was mapped from (AC24, R19). */
  raw: IContractProduct;
};

// -----------------------------------------------------------------------------
// MACHINE — `contract-product.machine.ts` (flow.md §3, §4; R20, R24)
// -----------------------------------------------------------------------------

/**
 * The fifteen nodes of the locked product chart. Thirteen are reportable
 * states; `SETUP_COMPLETE` and `TRIAL_NONE` are the neutral defaults of their
 * region and carry no meta value.
 */
export enum ContractProductState {
  PENDING = "available.status.pending",
  INACTIVE = "available.status.inactive",
  ACTIVE = "available.status.active",
  SUSPENDED = "available.status.suspended",
  EXPIRING = "available.status.expiring",
  CANCELLING = "available.status.cancelling",
  SETUP_INCOMPLETE = "available.setup.incomplete",
  SETUP_COMPLETE = "available.setup.complete",
  TRIAL_NONE = "available.trial.none",
  TRIAL_RUNNING = "available.trial.running",
  TRIAL_ENDING = "available.trial.ending",
  STAGED = "unavailable.staged",
  CANCELLED = "unavailable.cancelled",
  LAPSED = "unavailable.lapsed",
  FRAUD = "unavailable.fraud"
}

/** Context for the contract-product manager machine. */
export type ContractProductContext = {
  /** The contract the product belongs to; seeded from the first read. */
  contractId?: IContract["id"];

  /** The product this manager acts on; seeded from the scope at spawn. */
  contractProductId?: IContractProduct["id"];

  /** Spawned auth subscription actor. */
  authHelper?: ActorRef<AnyEventObject>;

  /** Error from the last operation. */
  error?: ResponseError;

  /** The raw IContractProduct API response. */
  rawContractProduct?: IContractProduct;

  /** The mapped contract product. */
  contractProduct?: ContractProduct;
};

// -----------------------------------------------------------------------------
// WRITE MODELS — design 8.3, ADR-28
// -----------------------------------------------------------------------------

/** The model the two `modify_renew` writes share; `renew` is set by the service. */
export type SoftCancelModel = {
  renew: boolean;
  reason?: string;
  customFields?: ICustomField[];
};

/** The model `setConsolidation` takes. */
export type SetConsolidationModel = {
  invoiceConsolidationEnabled: InvoiceConsolidationTypes;
};

/** The model `scheduleCancellation` takes (R18). */
export type ScheduleCancellationModel = {
  futureCancellationDate: string;
  reason?: string;
  customFields?: ICustomField[];
};

/** `PUT contracts/{c}/products/{p}/modify_renew` body. */
export type SoftCancelBody = {
  renew: boolean;
  cancellation_reason?: string;
  custom_fields?: ICustomField[];
};

/** `PUT contracts/{c}/products/{p}/properties` body. */
export type ConsolidationBody = {
  invoice_consolidation_enabled: InvoiceConsolidationTypes;
};

/** `PUT contracts/{c}/products/{p}/schedule-cancel` body. */
export type ScheduleCancellationBody = {
  future_cancellation_date: string;
  cancellation_reason?: string;
  custom_fields?: ICustomField[];
};

// -----------------------------------------------------------------------------
// QUERY MODEL — the collection's ONE request-state type (design 8.2)
// -----------------------------------------------------------------------------

/**
 * The whole request state as one model — `filters` (wire column → operator →
 * value; a bare column carries its value directly), `sort` and `pagination`.
 * This is the instance validated against `useQuerySchema()`.
 */
export type QueryModel = {
  filters?: {
    "product.name"?: { like?: string | null };
    "product.category.name"?: { like?: string | null };
    "product.category.id"?: string | null;
    "status.code"?: ContractStatusCodes | null;
    /** `neq` is `subscriptionsOnly` and the forced hide-one-time leaf; `eq` is `oneTimeOnly` (ADR-15, ADR-18). */
    billing_cycle_days?: { neq?: number | null; eq?: number | null };
    created_at?: { gt?: string | null };
    next_due_date?: { gt?: string | null };
    total_amount?: number | null;
  };
  sort?: SortEntry[];
  pagination?: { limit?: number; offset?: number };
};

/** The nested filter model — the `filters` branch of {@link QueryModel}. */
export type FilterModel = NonNullable<QueryModel["filters"]>;

/** One sort entry; `field` is the schema's own declared enum (design 8.2). */
export type SortEntry = {
  field: "status" | "created_at" | "next_due_date" | "cancelled_date";
  dir: SortDirection;
};

/** The ordered sort model — the `sort` branch of {@link QueryModel}. */
export type SortModel = NonNullable<QueryModel["sort"]>;

/** The order the list starts in — declared as the query schema's `sort` default. */
export const DEFAULT_SORT: SortModel = [
  { field: "created_at", dir: SortDirection.ASC }
];

/** The collection's query schema — a real Draft-07 schema the translator walks at runtime. */
export type ContractProductsQuerySchema = JsonSchema7;

// -----------------------------------------------------------------------------
// SERVICES CONTRACT
// -----------------------------------------------------------------------------

/** The reactive list query, minted ONCE per scope in `useContractProducts.ts`. */
export type ContractProductListQuery = ListQuery<
  IContractProduct[],
  ContractProduct[],
  QueryModel
>;

/** The contract `createContractProductServices` resolves to. */
export type ContractProductServices = {
  /** The module's base cache key; every write invalidates it whole (design 8.4). */
  queryKey: QueryKey;
  /** The target client this scope resolved. */
  clientId: ComputedRef<string | undefined>;
  /** The ONE addressability predicate the collection's request gates call. */
  isAvailable: ComputedRef<boolean>;
  /** The collection's list query; its request state is the declared query schema. */
  loadList: () => ContractProductListQuery;
  /** The dashboard's grouped counts (design 8.1, ADR-4). */
  loadGroupedCounts: () => Promise<ICProdGroup[]>;
  /** The purchased categories (R10, ADR-20). */
  loadPurchasedCategories: () => Promise<IProductCategory[]>;
  /** Stops the scoped show-delegated preference reader (design 8.5). */
  destroyPreference: () => void;
};

/** The XState services map `contract-product.machine.ts` invokes; each returns the raw record. */
export type ContractProductMachineServices = {
  load: (context: ContractProductContext) => Promise<IContractProduct>;
  requestSoftCancel: (
    context: ContractProductContext,
    event: AnyEventObject
  ) => Promise<IContractProduct | undefined>;
  abortSoftCancel: (
    context: ContractProductContext
  ) => Promise<IContractProduct | undefined>;
  setConsolidation: (
    context: ContractProductContext,
    event: AnyEventObject
  ) => Promise<IContractProduct | undefined>;
  scheduleCancellation: (
    context: ContractProductContext,
    event: AnyEventObject
  ) => Promise<IContractProduct | undefined>;
  revokeScheduledCancellation: (
    context: ContractProductContext
  ) => Promise<IContractProduct | undefined>;
};
