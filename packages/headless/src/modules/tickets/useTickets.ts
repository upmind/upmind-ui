import { createScopedComposable } from "../scope";
import createTicketsServices from "./tickets.services";
import { TICKETS_SCOPE_MATRIX } from "./tickets.types";
import { createTicketsActions } from "./useTickets.actions";
import { createTicketsContext } from "./useTickets.context";
import { createTicketsInternals } from "./useTickets.internals";
import { createTicketsMeta } from "./useTickets.meta";
import type { TicketsScopeMatrix } from "./tickets.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module tickets/useTickets
 * @description Scoped, query-backed collection of a client's own support
 * tickets: one TanStack list query per concrete `(actor, context)` scope. ONE
 * context is addressable — `.as('client').for('product', id)`, the tickets
 * raised about one of my contract products (AC-7). `.for('client', id)` stays
 * unspellable (R1): the list is never retargeted at another client, which is
 * a different axis from the entity it is read ABOUT. Its sibling is
 * `useTicket`, a second scoped composable registered under the SAME
 * module name; the composable name and the scope key carry the
 * differentiation.
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; the scope builder resolves SELF before this factory runs.
 */
function createTicketsForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor as ScopeActorTypes;

  /**
   * ONE services instance for this scope. `config.context` carries the
   * PRODUCT context when the caller named one; the target client is never in
   * it, so this always resolves the active session's own client.
   */
  const service = createTicketsServices(actorScope, config.context);

  // Mint the list query ONCE per scope — survives component lifecycles.
  const query = service.loadList();

  const actions = createTicketsActions(actorScope, service, query, scopeKey);

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    useActions: () => actions,
    useContext: () => createTicketsContext(actorScope, service, query),
    useInternals: () => createTicketsInternals(actorScope, query),
    useMeta: () => createTicketsMeta(actorScope, service, query)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for a client's own support tickets.
 *
 * @example
 * ```ts
 * const tickets = useTickets().as(ScopeActorTypes.SELF)
 * const { data, schemas } = tickets.useContext()
 * await tickets.useActions().isReady()
 * tickets.useActions().setCriteria({ filters: { isClosed: { eq: false } } })
 *
 * // AC-7 — the tickets raised about ONE of my products. The product is a
 * // relationship, so it is the scope, never a filter column.
 * const forProduct = useTickets()
 *   .as(ScopeActorTypes.CLIENT)
 *   .for(TicketsContextTypes.CONTRACT_PRODUCT, contractProductId)
 * ```
 */
// The matrix rides on the BUILDER (ADR-033): the playground's acting-for
// picker reads it off the composable to offer `.for('product', id)`. Declared
// without it, the picker offers nothing and the product context is unreachable.
export const useTickets = createScopedComposable<
  ReturnType<typeof createTicketsForScope>,
  TicketsScopeMatrix
>("tickets", createTicketsForScope, TICKETS_SCOPE_MATRIX);

// Type export for consumers
export type UseTickets = ReturnType<typeof useTickets>;
