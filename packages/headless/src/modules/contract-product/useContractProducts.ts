import { ref } from "vue";
// Deep path, never the `../scope` barrel — the aggregator-barrel `export *`
// hazard (code-quality.companion.md); `scope.builder` alone has no such cycle.
import { createScopedComposable } from "../scope/scope.builder";
import createContractProductServices from "./contract-product.services";
import { CONTRACT_PRODUCTS_SCOPE_MATRIX } from "./contract-product.types";
import { createContractProductsActions } from "./useContractProducts.actions";
import { createContractProductsContext } from "./useContractProducts.context";
import { createContractProductsInternals } from "./useContractProducts.internals";
import { createContractProductsMeta } from "./useContractProducts.meta";
import type { ContractProductsScopeMatrix } from "./contract-product.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
import type { ICProdGroup } from "@upmind-automation/types";
// -----------------------------------------------------------------------------
/**
 * @module contract-product/useContractProducts
 * @description Scoped, query-backed collection of a client's own contract
 * products: one TanStack list query per concrete `(actor, context)` scope,
 * minted once at construction so it survives component lifecycles. Its
 * sibling is `useContractProduct` — the per-product manager, registered under
 * the SAME module name; the composable name and the scope key carry the
 * differentiation.
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; the scope builder resolves SELF before this factory runs.
 */
function createContractProductsForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const actorScope = config.actor as ScopeActorTypes;

  const service = createContractProductServices(actorScope, config.context);

  // Mint the list query ONCE per scope — a `service.loadList()` inside a layer
  // factory mints a second query, with its own refs, key and effect scope.
  const query = service.loadList();

  // The dashboard's grouped counts (G1) — `loadGroupedCounts` is a promise
  // action with no backing query, so this is the one reactive channel a page
  // can read them off; minted once per scope, beside `query`.
  const groupedCounts = ref<ICProdGroup[]>([]);

  const actions = createContractProductsActions(
    actorScope,
    service,
    query,
    scopeKey,
    groupedCounts
  );

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for collection actions (criteria, extra reads, lifecycle). */
    useActions: () => actions,

    /** Sub-composable for collection context (reactive list + schema family). */
    useContext: () =>
      createContractProductsContext(actorScope, service, query, groupedCounts),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createContractProductsInternals(actorScope, query),

    /** Sub-composable for collection meta (state flags). */
    useMeta: () => createContractProductsMeta(actorScope, service, query)
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
