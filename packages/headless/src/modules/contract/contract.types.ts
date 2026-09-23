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
 * `contract.machine.ts`). Each composable owns its own context enum and scope
 * matrix; the view model, the services contract and the mappers are shared.
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

/** Context types for the contract MANAGER — which contract is being addressed. */
export enum ContractContextTypes {
  /** Acting on one existing contract by id. */
  CONTRACT = "contract"
}

/** Scope matrix for `useContract`. `.for('contract', id)` names the record. */
export const CONTRACT_SCOPE_MATRIX = {
  [ScopeActorTypes.SELF]: null as never,
  [ScopeActorTypes.STAFF]: null as never,
  [ScopeActorTypes.CLIENT]: ContractContextTypes.CONTRACT,
  [ScopeActorTypes.GUEST]: null as never
} as const;

/** Scope matrix type for `useContract` (derived from the runtime const). */
export type ContractScopeMatrix = typeof CONTRACT_SCOPE_MATRIX;

// -----------------------------------------------------------------------------
// MACHINE STATE — the eight reportable nodes of flow.md section 3
// -----------------------------------------------------------------------------

/** The typed state values of `contract.machine.ts`. */
export enum ContractState {
  PENDING = "available.pending",
  INACTIVE = "available.inactive",
  ACTIVE = "available.active",
  SUSPENDED = "available.suspended",
  CANCELLING = "available.cancelling",
  CANCELLED = "unavailable.cancelled",
  LAPSED = "unavailable.lapsed",
  FRAUD = "unavailable.fraud"
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
 * `SetPaymentMethodModel` alone (auth's single-`model` shape).
 */
export type ContractWriteModel = SetPaymentMethodModel;

// -----------------------------------------------------------------------------
// MACHINE CONTEXT — as `OrderContext` (R24); single form slot (auth shape)
// -----------------------------------------------------------------------------

/** Context for `contract.machine.ts`. */
export type ContractContext = {
  /** The contract being managed, seeded from `.for('contract', id)`. */
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

  /** The open form's model — set on open (empty), re-set by `SET`, parsed against `schema`. */
  model?: Partial<ContractWriteModel>;

  /** The open form's schema — `parse` shapes against it and `validate` checks against it. */
  schema?: JsonSchema7;

  /** The open form's uischema — set on open, read by the labs editor. */
  uischema?: UISchemaElement;
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
  pagination?: { limit?: number; offset?: number };
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
  /** `paymentMethod.available.checking.parsing` — shapes the model against `schema`. */
  parse: (
    context: ContractContext,
    event: AnyEventObject
  ) => Promise<ContractWriteModel>;
  /** `*.validating` — rejects with a 422 `DetailedError` on invalid. */
  validate: (context: ContractContext, event: AnyEventObject) => Promise<void>;
  /** `paymentMethod.processing.settingPaymentMethod.updating`. */
  setPaymentMethod: (
    context: ContractContext,
    event: AnyEventObject
  ) => Promise<IContract | undefined>;
};
