// -----------------------------------------------------------------------------
/**
 * @module scenarios/useTicket/ticket.summary
 * @description ONE ticket summary, shared by the ticket record (its Details
 * section) and the contract-product record (one section per ticket), so the
 * two can never draw a ticket differently. Its scopes read a mapped `Ticket`
 * (`tickets.mappers.ts`). The mapped ticket carries no priority and no
 * assignee, so neither is drawn.
 */

import type { TableCell } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

export const ticketSummary: TableCell[] = [
  {
    type: "TableCellStatus",
    scope: "#/properties/status",
    i18n: "text.status"
  },
  {
    type: "TableCellText",
    scope: "#/properties/reference",
    i18n: "text.reference"
  },
  {
    type: "TableCellText",
    scope: "#/properties/department/properties/name",
    i18n: "text.department"
  },
  {
    type: "TableCellDate",
    scope: "#/properties/dateCreated",
    i18n: "text.date_added"
  },
  {
    type: "TableCellDate",
    scope: "#/properties/dateUpdated",
    i18n: "text.date_updated"
  }
];
