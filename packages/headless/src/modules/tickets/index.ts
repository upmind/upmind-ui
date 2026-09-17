// -----------------------------------------------------------------------------
/**
 * @module tickets
 * @description Public exports for the client×self support-ticket data
 * layer — the COLLECTION (`useClientTickets`) and the MANAGER
 * (`useClientTicket`), each a separately exported, separately consumed
 * capability. Curated named re-exports only — no `export *` (Module
 * Visibility Law).
 */

// --- Composables
export { useClientTickets } from "./useClientTickets";
export type { UseClientTickets } from "./useClientTickets";
export { useClientTicket } from "./useClientTicket";
export type { UseClientTicket } from "./useClientTicket";

// --- Scope matrices + both context enums (the collection's and the manager's)
export {
  TICKETS_SCOPE_MATRIX,
  TICKET_SCOPE_MATRIX,
  TicketContextTypes,
  TicketsContextTypes,
  TicketsSortableProperties
} from "./tickets.types";
export type { TicketsScopeMatrix, TicketScopeMatrix } from "./tickets.types";

// --- Public model types
export type {
  Ticket,
  TicketAttachmentRef,
  TicketCreateModel,
  TicketDepartmentOption,
  TicketFeedEntry,
  TicketMessage,
  TicketMessageEditModel,
  TicketsFilterModel,
  TicketsQueryModel,
  TicketsSortModel,
  TicketStatusLog,
  TicketSubjectModel,
  TicketSupportPrefs
} from "./tickets.types";

// --- Sub-composable type exports (collection)
export type { UseClientTicketsActions } from "./useClientTickets.actions";
export type { UseClientTicketsContext } from "./useClientTickets.context";
export type { UseClientTicketsMeta } from "./useClientTickets.meta";
export type { UseClientTicketsInternals } from "./useClientTickets.internals";

// --- Sub-composable type exports (manager)
export type { UseClientTicketActions } from "./useClientTicket.actions";
export type { UseClientTicketContext } from "./useClientTicket.context";
export type { UseClientTicketMeta } from "./useClientTicket.meta";
export type { UseClientTicketInternals } from "./useClientTicket.internals";
