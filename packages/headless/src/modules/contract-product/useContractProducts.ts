import { createScopedComposable } from "../scope/scope.builder";
import { CONTRACT_PRODUCTS_SCOPE_MATRIX } from "./contract-product.types";
import createContractProductsServices from "./contract-products.services";
import { createContractProductsActions } from "./useContractProducts.actions";
import { createContractProductsContext } from "./useContractProducts.context";
import { createContractProductsInternals } from "./useContractProducts.internals";
import { createContractProductsMeta } from "./useContractProducts.meta";
import type {
  ContractProductsScope,
  ContractProductsScopeMatrix
} from "./contract-product.types";
import type { ScopeConfig, ScopeKey } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/useContractProducts
 * @description Scoped, query-backed collection of a client's own contract
 * products. An instance: one list query per concrete `(actor, context)` scope,
 * minted once at construction so it survives component lifecycles;
 * `destroy()` removes it from the registry. Its sibling is
 * `useContractProduct`, the per-product manager, registered under the same
 * module name; the scope key carries the differentiation.
 */

function createContractProductsForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
): ContractProductsScope {
  const actorScope = config.actor;

  const service = createContractProductsServices(actorScope, config.context);

  // Minted ONCE per scope: a query minted inside a layer factory is a second
  // query, with its own refs, key and effect scope.
  const query = service.loadList();
  const groupedCounts = service.loadGroupedCounts();

  /** ONE actions instance per scope; the layers below stay lazy. */
  const actions = createContractProductsActions(
    actorScope,
    service,
    query,
    groupedCounts,
    scopeKey,
    config.context
  );

  return {
    /** Sub-composable for collection actions (criteria, extra reads, lifecycle). */
    useActions: () => actions,

    /** Sub-composable for collection context (reactive list + schema family). */
    useContext: () =>
      createContractProductsContext(
        actorScope,
        service.loadContractProductLookup,
        query,
        groupedCounts
      ),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createContractProductsInternals(actorScope, query),

    /** Sub-composable for collection meta (state flags). */
    useMeta: () => createContractProductsMeta(actorScope, config.context, query)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for a client's own contract products.
 *
 * @example
 * ```ts
 * const products = useContractProducts().as('client')
 * const delegated = useContractProducts().as('client').for('delegated')
 * await products.useActions().isReady()
 * ```
 */
export const useContractProducts = createScopedComposable<
  ReturnType<typeof createContractProductsForScope>,
  ContractProductsScopeMatrix
>(
  "contract-product",
  createContractProductsForScope,
  CONTRACT_PRODUCTS_SCOPE_MATRIX
);

export type UseContractProducts = ReturnType<typeof useContractProducts>;
