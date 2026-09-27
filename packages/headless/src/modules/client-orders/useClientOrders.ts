import { createScopedComposable } from "../scope";
import createClientOrdersServices from "./client-orders.services";
import { CLIENT_ORDERS_SCOPE_MATRIX } from "./client-orders.types";
import { createClientOrdersActions } from "./useClientOrders.actions";
import { createClientOrdersContext } from "./useClientOrders.context";
import { createClientOrdersInternals } from "./useClientOrders.internals";
import { createClientOrdersMeta } from "./useClientOrders.meta";
import type { ClientOrdersCollectionScopeMatrix } from "./client-orders.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-orders/useClientOrders
 * @description Scoped, query-backed collection of a client's own placed
 * orders (`new_contract` invoices): one TanStack list query per scope,
 * minted once at construction so it survives component lifecycles.
 * `client x self` only — the oracle names no delegated entity (FE-3237 Out
 * of Scope), so the matrix refuses every `.for()` cell (design 5.2 [h15]).
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 2 — armless: no `.{actor}.ts` sibling exists at any
 * layer. One actor (`client`) resolves; no second actor has a member
 * exclusive to it or overriding the shared factory.
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; the scope builder resolves SELF before this factory runs.
 */
function createClientOrdersForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor as ScopeActorTypes;

  /** ONE services instance for this scope. */
  const service = createClientOrdersServices();

  /** Mint the list query ONCE per scope. */
  const query = service.loadList();

  /** ONE actions instance per scope; the layers below stay lazy. */
  const actions = createClientOrdersActions(
    actorScope,
    service,
    query,
    scopeKey
  );

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for collection actions (list controls, lifecycle). */
    useActions: () => actions,

    /** Sub-composable for collection context (reactive list + criteria/schemas). */
    useContext: () => createClientOrdersContext(actorScope, service, query),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createClientOrdersInternals(actorScope, query),

    /** Sub-composable for collection meta (state flags). */
    useMeta: () => createClientOrdersMeta(actorScope, service, query)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for a client's own order history.
 *
 * @example
 * ```ts
 * const orders = useClientOrders().as('self')
 * const { data, pagination } = orders.useContext()
 * await orders.useActions().isReady()
 * orders.useActions().setPage(2)
 * ```
 */
export const useClientOrders = createScopedComposable<
  ReturnType<typeof createClientOrdersForScope>,
  ClientOrdersCollectionScopeMatrix
>("client-orders", createClientOrdersForScope, CLIENT_ORDERS_SCOPE_MATRIX);

// Type export for consumers
export type UseClientOrders = ReturnType<typeof useClientOrders>;
