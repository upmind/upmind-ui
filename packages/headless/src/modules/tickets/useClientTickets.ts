import { createScopedComposable } from "../scope";
import createTicketsServices from "./tickets.services";
import { createClientTicketsActions } from "./useClientTickets.actions";
import { createClientTicketsContext } from "./useClientTickets.context";
import { createClientTicketsInternals } from "./useClientTickets.internals";
import { createClientTicketsMeta } from "./useClientTickets.meta";
import type { TicketsScopeMatrix } from "./tickets.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module tickets/useClientTickets
 * @description Scoped, query-backed collection of a client's own support
 * tickets: one TanStack list query per concrete `(actor, context)` scope. ONE
 * context is addressable — `.as('client').for('product', id)`, the tickets
 * raised about one of my contract products (AC-7). `.for('client', id)` stays
 * unspellable (R1): the list is never retargeted at another client, which is
 * a different axis from the entity it is read ABOUT. Its sibling is
 * `useClientTicket`, a second scoped composable registered under the SAME
 * module name; the composable name and the scope key carry the
 * differentiation.
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; the scope builder resolves SELF before this factory runs.
 */
function createClientTicketsForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor as ScopeActorTypes;

  /**
   * ONE services instance for this scope. `config.context` carries the
   * PRODUCT context when the caller named one; the target client is never in
   * it, so this always resolves the active session's own client.
   */
  const service = createTicketsServices(actorScope, config.context);

  // Mint the list query ONCE per scope — survives component lifecycles.
  const query = service.loadList();

  const actions = createClientTicketsActions(
    actorScope,
    service,
    query,
    scopeKey
  );

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    useActions: () => actions,
    useContext: () => createClientTicketsContext(actorScope, service, query),
    useInternals: () => createClientTicketsInternals(actorScope, query),
    useMeta: () => createClientTicketsMeta(actorScope, service, query)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for a client's own support tickets.
 *
 * @example
 * ```ts
 * const tickets = useClientTickets().as(ScopeActorTypes.SELF)
 * const { data, schemas } = tickets.useContext()
 * await tickets.useActions().isReady()
 * tickets.useActions().setCriteria({ filters: { isClosed: { eq: false } } })
 *
 * // AC-7 — the tickets raised about ONE of my products. The product is a
 * // relationship, so it is the scope, never a filter column.
 * const forProduct = useClientTickets()
 *   .as(ScopeActorTypes.CLIENT)
 *   .for(TicketsContextTypes.PRODUCT, contractProductId)
 * ```
 */
export const useClientTickets = createScopedComposable<
  ReturnType<typeof createClientTicketsForScope>,
  TicketsScopeMatrix
>("tickets", createClientTicketsForScope);

// Type export for consumers
export type UseClientTickets = ReturnType<typeof useClientTickets>;
