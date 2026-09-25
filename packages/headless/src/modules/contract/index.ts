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

// --- Scope matrices — one per composable
export {
  CONTRACTS_SCOPE_MATRIX,
  ContractsContextTypes,
  ContractState
} from "./contract.types";
export type { ContractsScopeMatrix } from "./contract.types";
/**
 * @decision
 * what: this barrel exports the COLLECTION's matrix, its type and its context
 *   enum, and exports none of the three for the MANAGER. The template contract
 *   expects a barrel export per composable.
 * template-departure: ContractContextTypes
 * why: the manager is a single-record read. `ContractContextTypes`, the
 *   context enum the template names, does not exist (see the @decision in
 *   `contract.types.ts`), and its matrix is all-`never`, so it names nothing
 *   a consumer can spell — there is no `.for()` call it could ever type.
 *   templates/SINGLE-READ.md states the rule directly: do not re-export the
 *   all-`never` matrix from the module barrel.
 * rejected: exporting `CONTRACT_SCOPE_MATRIX` and `ContractScopeMatrix` for
 *   symmetry with the collection. A consumer who imports them can only pass
 *   them where the factory already applies them, so the export advertises a
 *   choice that does not exist. (D95)
 */

// --- Public model types (shared by both composables)
export type {
  Contract,
  ContractContext,
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
