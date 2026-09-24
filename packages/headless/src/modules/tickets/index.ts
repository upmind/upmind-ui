// -----------------------------------------------------------------------------
/**
 * @module tickets
 * @description Public exports for the client×self support-ticket data
 * layer — the COLLECTION (`useTickets`) and the MANAGER
 * (`useTicket`), each a separately exported, separately consumed
 * capability. Curated named re-exports only — no `export *` (Module
 * Visibility Law).
 */

// --- Composables
export { useTickets } from "./useTickets";
export type { UseTickets } from "./useTickets";
export { useTicket } from "./useTicket";
export type { UseTicket } from "./useTicket";

// --- Scope matrices + both context enums (the collection's and the manager's)
export {
  TICKETS_SCOPE_MATRIX,
  TICKET_SCOPE_MATRIX,
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
export type { UseTicketsActions } from "./useTickets.actions";
export type { UseTicketsContext } from "./useTickets.context";
export type { UseTicketsMeta } from "./useTickets.meta";
export type { UseTicketsInternals } from "./useTickets.internals";

// --- Sub-composable type exports (manager)
export type { UseTicketActions } from "./useTicket.actions";
export type { UseTicketContext } from "./useTicket.context";
export type { UseTicketMeta } from "./useTicket.meta";
export type { UseTicketInternals } from "./useTicket.internals";
