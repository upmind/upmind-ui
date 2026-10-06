import { computed, ref, watch } from "vue";
import { usePersonalDetails } from "../client-personal-details";
// Deep path, never the `../scope` barrel — the aggregator-barrel `export *`
// hazard (code-quality.companion.md); `scope.builder` alone has no such cycle.
import { createScopedComposable } from "../scope/scope.builder";
import { ScopeActorTypes } from "../scope/scope.types";
import { resolveClientId, useActiveSession } from "../session-store";
import createContractProductServices from "./contract-product.services";
import {
  CONTRACT_PRODUCTS_SCOPE_MATRIX,
  ContractProductsContextTypes
} from "./contract-product.types";
import { resolveExcludeDelegated } from "./contract-product.utils";
import { createContractProductsActions } from "./useContractProducts.actions";
import { createContractProductsContext } from "./useContractProducts.context";
import { createContractProductsInternals } from "./useContractProducts.internals";
import { createContractProductsMeta } from "./useContractProducts.meta";
import type {
  ContractProductsScopeMatrix,
  ShowDelegatedPreference
} from "./contract-product.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeContext } from "../scope/scope.types";
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
/**
 * The show-delegated preference seam (design 8.5). `client-personal-details`
 * owns the channel; this module owns the meaning of the key. Constructed ONCE
 * per collection scope with `.fresh()`, so it never collides with a consumer's
 * own profile editor. The `DELEGATED` selector context forces the value and
 * never reads the preference.
 */
function createShowDelegatedPreference(
  scopeContext?: ScopeContext
): ShowDelegatedPreference {
  const { hasDelegatedProducts } = useActiveSession().useMeta();
  const isDelegated =
    scopeContext?.type === ContractProductsContextTypes.DELEGATED;
  const manager = isDelegated
    ? undefined
    : usePersonalDetails().as(ScopeActorTypes.CLIENT).fresh();
  manager?.useActions().filterFields(["excludeDelegatedProducts"]);

  const isSettled = computed(
    () => !manager || !manager.useMeta().isLoading.value
  );

  return {
    excludeDelegated: computed(() =>
      resolveExcludeDelegated(
        scopeContext,
        manager?.useContext().model.value?.excludeDelegatedProducts,
        hasDelegatedProducts.value
      )
    ),
    isSettled,
    whenSettled: () => {
      if (isSettled.value) return Promise.resolve();

      return new Promise<void>(resolve => {
        const stop = watch(isSettled, settled => {
          if (!settled) return;
          stop();
          resolve();
        });
      });
    },
    destroy: () => manager?.useActions().destroy()
  };
}

function createContractProductsForScope(
  config: ScopeConfig,
  scopeKey: ScopeKey
) {
  const actorScope = config.actor;

  const clientId = resolveClientId(config.context);
  const preference = createShowDelegatedPreference(config.context);
  const service = createContractProductServices(
    actorScope,
    config.context,
    clientId,
    preference
  );

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
    groupedCounts,
    clientId,
    preference
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
    useMeta: () => createContractProductsMeta(actorScope, clientId, query)
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
