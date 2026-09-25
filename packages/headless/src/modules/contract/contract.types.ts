import { AccessRoleTypes } from "@upmind-automation/types";
import { ScopeActorTypes } from "../scope/scope.types";
import type { ResponseError } from "../../utils";
import type { ContractProduct } from "../contract-product";
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
 * enum (D93, templates/SINGLE-READ.md). The view model, the services
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
 *   CLIENT cell — the shape this module shipped before D93. It modelled a
 *   leaf record as an ADR-001 context with no oracle entity behind it, and
 *   only renamed the template's `.for('module-item', id)` /
 *   `ModuleContextTypes.ITEM`. See the exemplar `useContractProduct`
 *   (D46) and `tickets/useTicket` (2026-09-22 operator review).
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

/** The contract's `status`, narrowed to the platform enum. */
export type ContractStatus = Pick<IStatus, "code"> & {
  code: ContractStatusCodes;
};

/** The cancellation request's `status`, narrowed to the platform enum. */
export type CancellationRequestStatus = Pick<IStatus, "code"> & {
  code: CancellationRequestStatusCodes;
};

/** The `cancellation_request` relation, reduced to the one member this module reads. */
export type ContractCancellationRequest = {
  [K in keyof Pick<
    IContractCancellationRequest,
    "status"
  >]?: CancellationRequestStatus;
};

/** The view model `contract.mappers.ts` maps `IContract` into — only the fields this module reads. */
export type Contract = {
  id: IContract["id"];
  status: ContractStatus;
  cancellationRequest?: ContractCancellationRequest;
  /** The stored method that pays the contract today — the no-op refusal of `setPaymentMethod` reads it (AC8, R31). */
  paymentDetailsId: IContract["payment_details_id"];
  products: ContractProduct[];
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
// QUERY MODEL — pagination only (design 8.1, AC14)
// -----------------------------------------------------------------------------

/** The collection's ONE request-state model — the instance `useQuerySchema()` validates. */
export type QueryModel = {
  // `offset` alone is unspellable — with no page size the page index is NaN; `limit` alone stays the page-size door.
  pagination?:
    | { limit?: number; offset?: never }
    | { limit: number; offset?: number };
};

/** The reactive list query, minted ONCE per scope in `useContracts.ts`. */
export type ContractListQuery = ListQuery<IContract[], Contract[], QueryModel>;

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
