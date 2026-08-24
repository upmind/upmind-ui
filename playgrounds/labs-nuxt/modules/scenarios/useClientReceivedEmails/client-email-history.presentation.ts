// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientReceivedEmails/client-email-history.presentation
 * @description How a client's received email DRAWS — the collection as a table,
 * and ONE record READ-ONLY in the detail overlay. Grounded field by field on
 * the live row `useClientReceivedEmails().useContext().data` publishes
 * (`SentEmail` in `client-email-history.mappers.ts`), so nothing here describes
 * a shape the composable does not produce.
 *
 * The detail is the point of the FETCH path: it declares `body`, which the
 * collection row need not carry in full, so the overlay's `useClientReceivedEmail`
 * read is what fills it. A column exists because it was declared, never because
 * a key happened to be on the row.
 *
 * ORDERING is not here at all (`R6-28`): the collection is ordered by the query
 * schema's own `sort` enum, which the control reads directly.
 */

import {
  ActionPlacementTypes,
  CardSlotTypes,
  TableColumnWidthTypes
} from "../runtime/scenario.types";
import type {
  ActionsUischema,
  CardUischema,
  DetailUischema,
  TableUischema
} from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** The delivery flags a record carries, drawn as badges — the same `meta` the row publishes. */
const STATUS_BADGES = [
  { flag: "isSent", i18n: "text.sent", color: "success" as const },
  { flag: "isBounced", i18n: "text.bounced_label", color: "danger" as const },
  // An errored email is neither sent nor bounced, so omitting `isError` left
  // every failed record with no status at all — the mapper publishes the flag.
  { flag: "isError", i18n: "text.failed", color: "danger" as const }
];

export const tableUischema: TableUischema = {
  type: "TableLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/subject",
      i18n: "text.subject",
      options: { width: TableColumnWidthTypes.THIRD }
    },
    {
      type: "TableCellText",
      scope: "#/properties/recipient/properties/name",
      i18n: "text.recipient",
      options: { width: TableColumnWidthTypes.QUARTER }
    },
    {
      // Status-conditional date (sent/bounced/errored) — never a blank column
      // for unsent rows, which binding `dateSent` unconditionally produced.
      type: "TableCellDate",
      scope: "#/properties/date",
      i18n: "text.date_sent"
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: { badges: STATUS_BADGES }
    }
  ]
};

/**
 * The SAME record, drawn as a card — a second declaration, never a second
 * component. The subject rides the TITLE slot, recipient/status on SUBTITLE,
 * date on BODY.
 */
export const cardUischema: CardUischema = {
  type: "CardLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/subject",
      i18n: "text.subject",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/recipient/properties/name",
      i18n: "text.recipient",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: { badges: STATUS_BADGES, slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/date",
      i18n: "text.date_sent",
      options: { slot: CardSlotTypes.SUBTITLE }
    }
  ]
};

/**
 * ONE record drawn READ-ONLY — the same cell renderers the table uses (`R6-36`),
 * over more fields than a row shows. `body` is the tell: the list need not carry
 * it, so the overlay's `useDetail` read fetches the full record to draw it.
 */
export const detailUischema: DetailUischema = {
  type: "DetailLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/subject",
      i18n: "text.subject"
    },
    { type: "TableCellText", scope: "#/properties/from", i18n: "text.from" },
    {
      type: "TableCellText",
      scope: "#/properties/recipient/properties/email",
      i18n: "text.to"
    },
    { type: "TableCellText", scope: "#/properties/cc", i18n: "text.cc" },
    {
      // The same status-conditional date the column draws: `dateSent` is
      // `sent_at`, which is null for anything that never sent.
      type: "TableCellDate",
      scope: "#/properties/date",
      i18n: "text.date_sent"
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: { badges: STATUS_BADGES }
    },
    { type: "TableCellHtml", scope: "#/properties/body", i18n: "text.body" }
  ]
};

/**
 * The one control the module offers: open the record READ-ONLY. It calls no
 * live action and opens no editor — the module has no mutation surface — so it
 * declares `detail`, the read verb, and the overlay's `useDetail` read fills
 * in what the row does not carry.
 */
export const actionsUischema: ActionsUischema = {
  type: "ActionsLayout",
  elements: [
    {
      type: "Action",
      name: "view",
      detail: true,
      i18n: "action.view_email",
      icon: "eye",
      variant: "outline",
      placement: ActionPlacementTypes.VISIBLE
    }
  ]
};
