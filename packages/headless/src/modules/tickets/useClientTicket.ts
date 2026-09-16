import { ref } from "vue";
import { createScopedComposable } from "../scope";
import createTicketsServices from "./tickets.services";
import { TicketContextTypes } from "./tickets.types";
import { createClientTicketActions } from "./useClientTicket.actions";
import { createClientTicketContext } from "./useClientTicket.context";
import { createClientTicketInternals } from "./useClientTicket.internals";
import { createClientTicketMeta } from "./useClientTicket.meta";
import type { TicketFeedEntry, TicketScopeMatrix } from "./tickets.types";
import type { ScopeConfig, ScopeKey } from "../scope";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module tickets/useClientTicket
 * @description Scoped manager for ONE support ticket, its merged message +
 * status-log feed, and its client-reachable lifecycle writes. One
 * interpreter-free instance per concrete `(actor, ticket)` scope — RULED R1:
 * the ticket being addressed comes from `.as('client').for('ticket', id)`,
 * `ADR-001:117,133` naming `ticket` a genuine context (a ticket owns its own
 * records — its messages — so it is not a leaf, and `SINGLE-READ.md`'s
 * `.withId(id)` is overruled for this module). Registered under the SAME
 * module name as `useClientTickets`; the composable name and the scope key
 * carry the differentiation.
 *
 * @doctrine clause 1 (uniform four-layer default).
 * @doctrine clause 4 — `config.actor` arriving here is ALREADY a concrete
 * actor; never branch on SELF in this file.
 */
function createClientTicketForScope(config: ScopeConfig, scopeKey: ScopeKey) {
  const actorScope = config.actor as ScopeActorTypes;

  /** The ticket being addressed is carried by the scope context (R1). */
  const ticketId =
    config.context?.type === TicketContextTypes.TICKET
      ? config.context.id
      : undefined;

  /** ONE services instance for this scope. `config.context` goes in here and nowhere else. */
  const service = createTicketsServices(actorScope, config.context);
  const query = service.loadOne(ticketId);

  /** The merged feed's reactive state — written by actions, read by context. */
  const feed = {
    entries: ref<TicketFeedEntry[]>([]),
    hasOlder: ref(false),
    hasNewer: ref(false),
    isLoading: ref(false)
  };

  /** The poll (AC29) — armed automatically as the loaded ticket's status changes. */
  const internals = createClientTicketInternals(actorScope, query);

  const actions = createClientTicketActions(
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
    useContext: () =>
      createClientTicketContext(actorScope, service, query, feed),
    useInternals: () => internals,
    useMeta: () => createClientTicketMeta(actorScope, service, query)
  };
}
// -----------------------------------------------------------------------------
/**
 * Scoped composable for one client's support ticket.
 *
 * @example
 * ```ts
 * const ticket = useClientTicket()
 *   .as(ScopeActorTypes.CLIENT)
 *   .for(TicketContextTypes.TICKET, ticketId)
 * const { data, feed } = ticket.useContext()
 * await ticket.useActions().isReady()
 * await ticket.useActions().reply('Thanks for the update')
 * ```
 */
export const useClientTicket = createScopedComposable<
  ReturnType<typeof createClientTicketForScope>,
  TicketScopeMatrix
>("tickets", createClientTicketForScope);

// Type export for consumers
export type UseClientTicket = ReturnType<typeof useClientTicket>;
