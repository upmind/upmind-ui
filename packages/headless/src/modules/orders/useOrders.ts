import { createScopedComposable } from "../scope";
import createOrdersServices from "./orders.services";
import { ORDERS_SCOPE_MATRIX } from "./orders.types";
import { createOrdersActions } from "./useOrders.actions";
import { createOrdersContext } from "./useOrders.context";
import { createOrdersInternals } from "./useOrders.internals";
import { createOrdersMeta } from "./useOrders.meta";
import type { OrdersCollectionScopeMatrix } from "./orders.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module orders/useOrders
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
function createOrdersForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor as ScopeActorTypes;

  /**
   * ONE services instance for this scope. `config.context` goes in here and
   * nowhere else, so every request the collection issues resolves the same
   * target client.
   */
  const service = createOrdersServices(actorScope, config.context);

  /** Mint the list query ONCE per scope. */
  const query = service.loadList();

  /** ONE actions instance per scope; the layers below stay lazy. */
  const actions = createOrdersActions(actorScope, service, query, scopeKey);

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    /** Sub-composable for collection actions (list controls, lifecycle). */
    useActions: () => actions,

    /** Sub-composable for collection context (reactive list + criteria/schemas). */
    useContext: () => createOrdersContext(actorScope, service, query),

    /** Sub-composable for advanced debugging and internal access. */
    useInternals: () => createOrdersInternals(actorScope, query),

    /** Sub-composable for collection meta (state flags). */
    useMeta: () => createOrdersMeta(actorScope, service, query)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for a client's own order history.
 *
 * @example
 * ```ts
 * const orders = useOrders().as('self')
 * const { data, pagination } = orders.useContext()
 * await orders.useActions().isReady()
 * orders.useActions().setPage(2)
 * ```
 */
export const useOrders = createScopedComposable<
  ReturnType<typeof createOrdersForScope>,
  OrdersCollectionScopeMatrix
>("orders", createOrdersForScope, ORDERS_SCOPE_MATRIX);

// Type export for consumers
export type UseOrders = ReturnType<typeof useOrders>;
