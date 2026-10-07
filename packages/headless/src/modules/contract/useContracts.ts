import { createScopedComposable } from "../scope/scope.builder";
import createContractServices from "./contract.services";
import { CONTRACTS_SCOPE_MATRIX } from "./contract.types";
import { createContractsActions } from "./useContracts.actions";
import { createContractsContext } from "./useContracts.context";
import { createContractsInternals } from "./useContracts.internals";
import { createContractsMeta } from "./useContracts.meta";
import type { ContractsScopeMatrix } from "./contract.types";
import type { ScopeConfig, ScopeKey } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module contract/useContracts
 * @description Scoped, query-backed collection of a client's own contracts:
 * one TanStack list query per concrete `(actor, context)` scope, minted once
 * at construction. Its sibling is `useContract` — the per-contract manager,
 * registered under the same module name; the scope key carries the
 * differentiation.
 */
function createContractsForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor;

  const service = createContractServices(actorScope, config.context);

  const query = service.loadList();

  const actions = createContractsActions(actorScope, service, query, scopeKey);

  return {
    /** Sub-composable for collection actions (paging, lifecycle). */
    useActions: () => actions,

    /** Sub-composable for collection context (reactive list + lookups). */
    useContext: () => createContractsContext(actorScope, service, query),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createContractsInternals(actorScope, query),

    /** Sub-composable for collection meta (state flags). */
    useMeta: () => createContractsMeta(actorScope, service, query)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for a client's own contract collection.
 *
 * @example
 * ```ts
 * const contracts = useContracts().as('client')
 * const { data, pagination } = contracts.useContext()
 * await contracts.useActions().isReady()
 * ```
 */
export const useContracts = createScopedComposable<
  ReturnType<typeof createContractsForScope>,
  ContractsScopeMatrix
>("contract", createContractsForScope, CONTRACTS_SCOPE_MATRIX);

export type UseContracts = ReturnType<typeof useContracts>;
