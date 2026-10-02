import { AccessRoleTypes } from "@upmind-automation/types";
import { SortDirection } from "../query";
import { ScopeActorTypes } from "../scope/scope.types";
import type { FormattedDate, ResponseError } from "../../utils";
import type { ContractProductEmbedded } from "../contract-product";
import type { LookupItem } from "../lookup";
import type { PaymentDetail } from "../payment-details";
import type { ListQuery } from "../query";
import type { JsonSchema7, UISchemaElement } from "@jsonforms/core";
import type { QueryKey } from "@tanstack/vue-query";
import type {
  CancellationRequestStatusCodes,
  ContractStatusCodes,
  IContract,
  IContractCancellationRequest,
  IStatus
} from "@upmind-automation/types";
import type { ComputedRef } from "vue";
import type { ActorRef, AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @module contract/contract.types
 * @description Types for a client's own contracts — the query-backed
 * COLLECTION (`useContracts`) and the bespoke-machine MANAGER (`useContract`,
 * `contract.machine.ts`). The collection owns its own context enum and scope
 * matrix; the manager is a single-record read by id and declares no context
 * enum (D95, templates/SINGLE-READ.md). The view model, the services
 * contract and the mappers are shared.
 */

// -----------------------------------------------------------------------------
// SCOPE — two matrices, one per composable
// -----------------------------------------------------------------------------

/** Context types for the contract COLLECTION — whose list is being addressed. */
export enum ContractsContextTypes {
  /** Acting on a client's own contract collection. */
  CLIENT = AccessRoleTypes.CLIENT
}

/** Scope matrix for `useContracts`. Only `client` resolves (R2). */
export const CONTRACTS_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: ContractsContextTypes.CLIENT,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useContracts` (derived from the runtime const). */
export type ContractsScopeMatrix = typeof CONTRACTS_SCOPE_MATRIX;

/**
 * Scope matrix for `useContract` — every actor refused.
 *
 * @decision
 * what: the manager declares NO context enum, and every cell of its matrix is
 *   `never`.
 * why: `useContract` is a SINGLE-RECORD READ BY ID (templates/SINGLE-READ.md).
 *   The contract id rides on `.withId(id)`, which `generateScopeKey` folds in
 *   as `id:<value>`. `ContextsForActor` resolves `never` for all four actors,
 *   so `MatrixHasAnyContexts` is `false` and `.for()` is a compile error for
 *   everyone.
 * rejected: minting a `ContractContextTypes.CONTRACT` and naming it in the
 *   CLIENT cell — the shape this module shipped before D95. It modelled a
 *   leaf record as an ADR-001 context with no oracle entity behind it, and
 *   only renamed the template's former `ModuleContextTypes.ITEM`, which the
 *   hybrid template has since dropped for `.withId(id)`. See the exemplar
 *   `useContractProduct` (D46) and `tickets/useTicket` (2026-09-22 operator
 *   review).
 */
export const CONTRACT_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: null as never,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useContract` (derived from the runtime const). */
export type ContractScopeMatrix = typeof CONTRACT_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// MACHINE STATE — the eight reportable nodes of flow.md section 3
// -----------------------------------------------------------------------------

/** The typed state values of `contract.machine.ts`. `available` and
 * `unavailable` are parallel over a `status` region and a
 * `changingPaymentMethod` form region (R35), so every status node sits under
 * `.status`. */
export enum ContractState {
  PENDING = "available.status.pending",
  INACTIVE = "available.status.inactive",
  ACTIVE = "available.status.active",
  SUSPENDED = "available.status.suspended",
  CANCELLING = "available.status.cancelling",
  CANCELLED = "unavailable.status.cancelled",
  LAPSED = "unavailable.status.lapsed",
  FRAUD = "unavailable.status.fraud"
}

// -----------------------------------------------------------------------------
// VIEW MODEL — the mapping law (design 8.10, R19, R24, R25)
// -----------------------------------------------------------------------------

/** The contract's `status`, narrowed to the platform enum, plus its translated name. */
export type ContractStatus = Pick<IStatus, "code"> & {
  code: ContractStatusCodes;
  /** `status.name_translated`, else `status.name` (R38 item 9). */
  name?: IStatus["name"];
};

/** The cancellation request's `status`, narrowed to the platform enum, plus its translated name. */
export type CancellationRequestStatus = Pick<IStatus, "code"> & {
  code: CancellationRequestStatusCodes;
  /** `status.name_translated`, else `status.name` (R38 item 9). */
  name?: IStatus["name"];
};

/**
 * One boolean per contract status code. A surface reads these off `meta`, the
 * same idiom the tickets module publishes for its own status badge
 * (`tickets.mappers.ts`'s `meta`, R38 item 9, G2).
 */
export type ContractMeta = {
  isActive: boolean;
  isAwaitingActivation: boolean;
  isCancelled: boolean;
  isClosed: boolean;
  isFraud: boolean;
  isPending: boolean;
  isSuspended: boolean;
};

/**
 * One boolean per cancellation-request status code — the same `meta` idiom,
 * for the contract's OWN cancellation request (R38 item 9, G2).
 */
export type ContractCancellationRequestMeta = {
  isAccepted: boolean;
  isCancellationRequest: boolean;
  isEndOfBillingCycle: boolean;
  isEndOfBillingCycleUnacknowledged: boolean;
  isScheduledFutureCancellation: boolean;
};

/** The `cancellation_request` relation, reduced to the one member this module reads. */
export type ContractCancellationRequest = {
  [K in keyof Pick<
    IContractCancellationRequest,
    "status"
  >]?: CancellationRequestStatus;
} & {
  /** The translated-badge flags for the cancellation request's own status (R38 item 9, G2). */
  meta?: ContractCancellationRequestMeta;
};

/** A `ContractProduct` as the contract read embeds it. The embedded shape now
 * lives on the contract-product module as {@link ContractProductEmbedded}, which
 * owns the product view model it narrows; this alias keeps the contract module's
 * own name stable for its `products` relation and its consumers. */
export type ContractEmbeddedProduct = ContractProductEmbedded;

/** The view model `contract.mappers.ts` maps `IContract` into — only the fields this module reads. */
export type Contract = {
  id: IContract["id"];
  status: ContractStatus;
  /** The translated-badge flags for `status.code` and for the cancellation request's own code, so one status cell badges both (R38 item 9, G2). */
  meta: ContractMeta & ContractCancellationRequestMeta;
  cancellationRequest?: ContractCancellationRequest;
  /** The stored method that pays the contract today — the no-op refusal of `setPaymentMethod` reads it (AC8, R31). */
  paymentDetailsId: IContract["payment_details_id"];
  /** The stored method as a labelled reading a surface shows — legacy's `payment_details.name` (`cProdPaymentMethodComp.vue:64`), via `useTranslateName`, the same name helper `payment-details` maps its `title` with (FE-3206). Absent when the contract has no stored method. */
  paymentMethod?: { id: IContract["payment_details_id"]; label: string };
  /** This contract's products, each mapped through `mapContractProduct`. The contract read carries no `allowed_migrations` and no `products.contract`, so the members that read them are left off the type; read those through `useContractProduct`. */
  products: ContractEmbeddedProduct[];
  /** What a client recognises the contract by (R38 item 8) — legacy's own title. */
  name: IContract["name"];
  /** The display title — `name`, else `#main_invoice_number` (R38 item 8). */
  title?: string;
  /** When the contract next bills (R38 item 8), as the wire ISO — never `raw.next_due_date`. `dateNextDue` is its display descriptor. */
  nextDueDate: IContract["next_due_date"];
  /** The next-due date a column DRAWS — a `useDate` descriptor `TableCellDate` reads, beside the ISO `nextDueDate` (tickets/invoices `date*` shape); empty for a one-time contract with no next due date. */
  dateNextDue: FormattedDate;
  /** The contract's own billing cycle, in months (R38 item 8). */
  billingCycleMonths: IContract["billing_cycle_months"];
  /** The translated billing-cycle label (R38 item 10, GAP-02) — legacy's cycle name; "One time" for a one-time contract. */
  billingCycleLabel: string;
  /** When the contract was purchased (R38 item 8), as the wire ISO — never `raw.start_date`. `datePurchased` is its display descriptor. */
  purchaseDate: IContract["start_date"];
  /** The purchase date a column DRAWS — the display descriptor beside the ISO `purchaseDate`. */
  datePurchased: FormattedDate;
  /** The wire-formatted recurring price (R38 item 8, R38 item 10 — no `raw.*` binding). */
  totalAmountFormatted: IContract["total_amount_formatted"];
  /** The wire record this view model was mapped from (AC24, R19). */
  raw: IContract;
};

// -----------------------------------------------------------------------------
// LOOKUPS & WRITE FORM — machine-owned form inputs (R34, auth form shape)
// -----------------------------------------------------------------------------

/** The reused lookups the machine loads on read, for the payment-method form. */
export type ContractLookups = {
  /** The client's stored payment methods (`usePaymentDetails`). */
  storedPaymentMethods?: PaymentDetail[];
};

/** `load` returns the record and its reused lookups in one settle (R34). */
export type ContractLoaded = {
  record: IContract;
  lookups: ContractLookups;
};

/**
 * The model a write form carries — parsed and validated before its service
 * runs. The contract holds ONE payment-method form (R34), so the write model is
 * `SetPaymentMethodModel` alone.
 */
export type ContractWriteModel = SetPaymentMethodModel;

/** One open write form — its own `context.paymentMethod` slot (R35). */
export type ContractForm = {
  schema?: JsonSchema7;
  uischema?: UISchemaElement;
  model?: Partial<ContractWriteModel>;
};

// -----------------------------------------------------------------------------
// MACHINE CONTEXT — as `OrderContext` (R24); single form slot (auth shape)
// -----------------------------------------------------------------------------

/** Context for `contract.machine.ts`. */
export type ContractContext = {
  /** The contract being managed, seeded from `.withId(id)`. */
  contractId?: IContract["id"];

  /** Spawned auth subscription actor. */
  authHelper?: ActorRef<AnyEventObject>;

  /** Error from the last operation. */
  error?: ResponseError;

  /** The raw `IContract` API response. */
  rawContract?: IContract;

  /** The mapped contract view model. */
  contract?: Contract;

  /** The reused lookups the payment-method form draws from (`loadLookups`). */
  lookups?: ContractLookups;

  /** The open payment-method form's OWN slot: `schema`, `uischema` and `model` (R35). */
  paymentMethod?: ContractForm;
};

// -----------------------------------------------------------------------------
// WRITE MODELS — design 8.3
// -----------------------------------------------------------------------------

/** The model `setPaymentMethod` takes. */
export type SetPaymentMethodModel = {
  paymentDetailsId: string;
};

/** `PATCH contracts/{id}/payment_details` wire body. */
export type SetPaymentMethodBody = {
  payment_details_id: SetPaymentMethodModel["paymentDetailsId"];
};

// -----------------------------------------------------------------------------
// QUERY MODEL — the criteria schema owns ALL request state (R38 item 13,
// supersedes R28/R32's pagination-only ruling)
// -----------------------------------------------------------------------------

/**
 * One sort entry over the contract's own fields. `name` is dropped (G1): every
 * recorded contract carries `name: null`, so ordering by it orders a column
 * that is never set.
 */
export type SortEntry = {
  field: "created_at" | "next_due_date" | "total_amount" | "status";
  dir: SortDirection;
};

/** The collection's ONE request-state model — the instance `useQuerySchema()` validates. */
export type QueryModel = {
  /** The platform quick-search term (G1) — searches across a contract's title, `name` and `main_invoice_number` alike, unlike the `filters.name` branch below. */
  query?: string | null;
  /** The filter branch — the contract's own fields plus legacy's contract filters (`vue-app src/data/filters/contract.ts`, G3). */
  filters?: {
    name?: { like?: string | null };
    /** The order number a contract's invoice carries (G3, legacy's "order" filter). */
    main_invoice_number?: string | null;
    "status.code"?: ContractStatusCodes[] | null;
    created_at?: { gte?: string | null; lte?: string | null };
    next_due_date?: { gte?: string | null; lte?: string | null };
    /** The contract's own recurring total (G3, legacy's "total" filter). */
    total_amount?: number | null;
  };
  sort?: SortEntry[];
  // `offset` alone is unspellable — with no page size the page index is NaN; `limit` alone stays the page-size door.
  pagination?:
    | { limit?: number; offset?: never }
    | { limit: number; offset?: number };
};

/** The nested filter model — the `filters` branch of {@link QueryModel}. */
export type FilterModel = NonNullable<QueryModel["filters"]>;

/** The ordered sort model — the `sort` branch of {@link QueryModel}. */
export type SortModel = NonNullable<QueryModel["sort"]>;

/** The order the list starts in — declared as the query schema's `sort` default. */
export const DEFAULT_SORT: SortModel = [
  { field: "created_at", dir: SortDirection.ASC }
];

/** The reactive list query, minted ONCE per scope in `useContracts.ts`. */
export type ContractListQuery = ListQuery<IContract[], Contract[], QueryModel>;

// -----------------------------------------------------------------------------
// CONTRACTS PICKER — the lookup `useContract` draws on when it has no id yet
// (R38 item 7, the `useTicket` / `schemas.ticketPicker` shape)
// -----------------------------------------------------------------------------

/**
 * The contracts picker's own criteria — the platform quick-search term a
 * picker control writes (G1: searches title, `name` and `main_invoice_number`
 * alike, not a `filters.name.like` branch that a nameless contract never
 * matches). Distinct from `invoices`' cross-module contract lookup, which
 * finds a contract FOR an invoice; this finds a contract IN this collection.
 */
export type ContractsPickerLookupQueryModel = {
  query?: string | null;
  pagination?: { limit?: number; offset?: number };
};

/** The contracts picker's lookup handle — a `listInfinite` query whose `select` maps rows to the option shape a lookup control renders. */
export type ContractsPickerLookupQuery = ListQuery<
  IContract[],
  LookupItem[],
  ContractsPickerLookupQueryModel
>;

/** A THUNK returning the once-minted {@link ContractsPickerLookupQuery}, so the first fetch defers to the control's own read. */
export type ContractsPickerLookupService = () => ContractsPickerLookupQuery;

// -----------------------------------------------------------------------------
// SERVICES CONTRACTS
// -----------------------------------------------------------------------------

/** The contract `createContractServices` resolves to — the collection's scoped services. */
export type ContractServices = {
  /** The module's base cache key; every write invalidates it whole (design 8.4). */
  queryKey: QueryKey;
  /** The target client this scope resolved. */
  clientId: ComputedRef<string | undefined>;
  /** True for an authenticated session with an addressable client. */
  isAvailable: ComputedRef<boolean>;
  /** The collection's list query. */
  loadList: () => ContractListQuery;
  /** Invalidates {@link ContractServices.queryKey} so every reader refetches. */
  refresh: () => Promise<void>;
  /** The picker's lookup, THUNKed so its first fetch defers to the control's own read (R38 item 7). */
  lookups: { contract: ContractsPickerLookupService };
};

/** The XState services map `contract.machine.ts` invokes — one key per `invoke.src`. */
export type ContractMachineServices = {
  /** `loading` — the raw contract read plus its reused stored-cards lookup. */
  load: (context: ContractContext) => Promise<ContractLoaded>;
  /** `changingPaymentMethod.available.checking` / `.processing.*.validating` — rejects with a 422 on invalid. */
  validatePaymentMethod: (context: ContractContext) => Promise<void>;
  /** `changingPaymentMethod.processing.settingPaymentMethod.updating`. */
  setPaymentMethod: (
    context: ContractContext
  ) => Promise<IContract | undefined>;
};
