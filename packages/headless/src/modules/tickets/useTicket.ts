import { ref } from "vue";
import { createScopedComposable } from "../scope";
import createTicketsServices from "./tickets.services";
import { TICKET_SCOPE_MATRIX } from "./tickets.types";
import { createTicketActions } from "./useTicket.actions";
import { createTicketContext } from "./useTicket.context";
import { createTicketInternals } from "./useTicket.internals";
import { createTicketMeta } from "./useTicket.meta";
import type { TicketFeedEntry, TicketScopeMatrix } from "./tickets.types";
import type { ScopeConfig, ScopeKey } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module tickets/useTicket
 * @description Scoped manager for ONE support ticket, its merged message +
 * status-log feed, and its client-reachable lifecycle writes. One
 * interpreter-free instance per concrete `(actor, id)` scope: the ticket being
 * addressed comes from `.as('client').withId(id)`.
 *
 * It came from `.for('ticket', id)` until an operator review on 2026-09-22,
 * which reversed R1/R11. Owning sub-records does not make a ticket a context:
 * a context names an entity the ACTOR ACTS UPON and retargets a relationship,
 * while this names the ONE record the instance reads. Registered under the
 * SAME module name as `useTickets`; the composable name and the scope
 * key carry the differentiation.
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; never branch on SELF in this file.
 */
function createTicketForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor;

  /**
   * The ticket being addressed is this instance's RECORD id — `.withId(id)`.
   *
   * It rode `.for('ticket', id)` until an operator review on 2026-09-22
   * reversed R1/R11: a single ticket is an instance, and `.for()` is for
   * retargeting a relationship the actor acts upon.
   */
  const ticketId = config.id;

  /** ONE services instance for this scope. The record id rides beside the context. */
  const service = createTicketsServices(actorScope, config.context, ticketId);
  const query = service.loadOne(ticketId);

  /** The merged feed's reactive state — written by actions, read by context. */
  const feed = {
    entries: ref<TicketFeedEntry[]>([]),
    hasOlder: ref(false),
    hasNewer: ref(false),
    isLoading: ref(false)
  };

  /** The poll (AC29) — armed automatically as the loaded ticket's status changes. */
  const internals = createTicketInternals(actorScope, query);

  const actions = createTicketActions(
    actorScope,
    service,
    query,
    feed,
    internals,
    ticketId,
    scopeKey
  );

  return {
    // --- Sub-composables (no direct props — clause 1 four-layer return)
    useActions: () => actions,
    useContext: () => createTicketContext(actorScope, service, query, feed),
    useInternals: () => internals,
    useMeta: () => createTicketMeta(actorScope, service, query)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for one client's support ticket.
 *
 * @example
 * ```ts
 * const ticket = useTicket()
 *   .as(ScopeActorTypes.CLIENT)
 *   .withId(ticketId)
 * const { data, feed } = ticket.useContext()
 * await ticket.useActions().isReady()
 * await ticket.useActions().reply('Thanks for the update')
 * ```
 */
export const useTicket = createScopedComposable<
  ReturnType<typeof createTicketForScope>,
  TicketScopeMatrix
>("tickets", createTicketForScope, TICKET_SCOPE_MATRIX);

// Type export for consumers
export type UseTicket = ReturnType<typeof useTicket>;
