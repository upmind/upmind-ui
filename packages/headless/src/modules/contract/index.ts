// -----------------------------------------------------------------------------
/**
 * @module contract
 * @description A client's own contracts. This module ships TWO scoped
 * composables: the collection (`useContracts`) and the per-contract manager
 * (`useContract`, backed by the module's own `contract.machine.ts`).
 *
 * This barrel is the module's ONLY public surface — `contract.services.ts`,
 * `contract.mappers.ts`, `contract.schemas.ts` and `contract.machine.ts` each
 * carry a line-1 internal marker and are never imported directly by another
 * module. Curated named re-exports only; no `export *`.
 *
 * Both composables support the CLIENT'S OWN scope only — `staff` and `guest`
 * are compile-time errors (ruling R2).
 */

// --- Composables (collection + manager)
export { useContracts, type UseContracts } from "./useContracts";
export { useContract, type UseContract } from "./useContract";

// --- Scope matrices — one per composable, both public
export {
  CONTRACTS_SCOPE_MATRIX,
  ContractsContextTypes,
  CONTRACT_SCOPE_MATRIX,
  ContractContextTypes,
  ContractState
} from "./contract.types";
export type {
  ContractsScopeMatrix,
  ContractScopeMatrix
} from "./contract.types";

// --- Public model types (shared by both composables)
export type {
  Contract,
  ContractContext,
  RequestCancellationModel,
  SetPaymentMethodModel
} from "./contract.types";

// --- Sub-composable type exports for consumers (collection)
export type { UseContractsActions } from "./useContracts.actions";
export type { UseContractsContext } from "./useContracts.context";
export type { UseContractsMeta } from "./useContracts.meta";
export type { UseContractsInternals } from "./useContracts.internals";

// --- Sub-composable type exports for consumers (manager)
export type { UseContractActions } from "./useContract.actions";
export type { UseContractContext } from "./useContract.context";
export type { UseContractMeta } from "./useContract.meta";
export type { UseContractInternals } from "./useContract.internals";
