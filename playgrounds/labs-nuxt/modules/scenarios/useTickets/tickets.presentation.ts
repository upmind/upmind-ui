// -----------------------------------------------------------------------------
/**
 * @module scenarios/useTickets/tickets.presentation
 * @description How a client's support ticket DRAWS — the collection as a
 * table, and ONE record READ-ONLY in the detail overlay. Grounded field by
 * field on the live row `useTickets().useContext().data` publishes
 * (`Ticket` in `tickets.types.ts`), so nothing here describes a shape the
 * composable does not produce.
 *
 * NO EDITOR. The module's writes (`reply`, `close`, `reopen`, `setSubject`,
 * attachments) live on the per-record MANAGER's own action map
 * (`useTicket().useActions()`), and `useTickets` (the collection
 * this page binds as `useList`) carries no matching generic write the
 * runtime's handoff/form-flow surface can drive (no `update`/`resolve`
 * member), so no `handoff` is declared here.
 *
 * The detail overlay FETCHES: `tickets.scenario.ts` declares `useDetail`, so
 * `view` boots the manager `.withId(<row.id>)` and draws the record it reads
 * — the conversation included — not the row the list already held.
 * The detail overlay below draws the clicked row's OWN data instead, which
 * loses nothing since `Ticket` is `ITicket` un-reduced — `department`'s full
 * name and the linked `contract_product` are already on the row the list
 * fetched, never a second read.
 *
 * ORDERING is not here at all (`R6-28`): the collection is ordered by the
 * query schema's own `sort` enum, which the control reads directly.
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

/**
 * The flags a row is badged with, read off `meta` (`tickets.mappers.ts`): the
 * status it is in, plus the two settings that gate writes — the LOCK
 * (AC24/AC27: a locked ticket refuses close, subject and related-product) and
 * DELEGATION (R12/AC10: a ticket delegated in rides the SAME list). One column
 * says what is true of the ticket; a column per flag said it six times over.
 */
const STATUS_BADGES = [
  { flag: "isOpen", i18n: "text.ticket_open", color: "success" as const },
  {
    flag: "isAwaitingResponse",
    i18n: "text.ticket_awaiting_response",
    color: "warning" as const
  },
  {
    flag: "isClientReplied",
    i18n: "text.ticket_client_replied",
    color: "info" as const
  },
  {
    flag: "isInProgress",
    i18n: "text.ticket_in_progress",
    color: "info" as const
  },
  { flag: "isScheduled", i18n: "text.ticket_scheduled" },
  { flag: "isClosed", i18n: "text.ticket_closed" },
  { flag: "isDelegated", i18n: "text.delegated_label", icon: "users-01" },
  {
    flag: "isLocked",
    i18n: "text.locked_label",
    color: "danger" as const,
    icon: "lock-01"
  }
];

export const tableUischema: TableUischema = {
  type: "TableLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/reference",
      i18n: "text.reference",
      options: { width: TableColumnWidthTypes.SIXTH }
    },
    {
      type: "TableCellText",
      scope: "#/properties/subject",
      i18n: "text.subject",
      options: { width: TableColumnWidthTypes.THIRD }
    },
    {
      type: "TableCellText",
      scope: "#/properties/department/properties/name",
      i18n: "text.department"
    },
    {
      type: "TableCellDate",
      scope: "#/properties/dateUpdated",
      i18n: "text.date_updated"
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
 * component. Reference/subject ride the TITLE slot, status/department/
 * delegated on SUBTITLE, updated date on BODY.
 */
export const cardUischema: CardUischema = {
  type: "CardLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/reference",
      i18n: "text.reference",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/subject",
      i18n: "text.subject",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: { badges: STATUS_BADGES, slot: CardSlotTypes.SUBTITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/department/properties/name",
      i18n: "text.department",
      options: { slot: CardSlotTypes.SUBTITLE }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/dateUpdated",
      i18n: "text.date_updated",
      options: { slot: CardSlotTypes.BODY }
    }
  ]
};

/**
 * ONE ticket drawn READ-ONLY — the record `useDetail` fetches `.withId(id)`,
 * through the same cell renderers the table uses (`R6-36`). `contract_product`
 * (AC13) is read on OPEN, not scanned across every row, so it is declared here
 * and not in the table. The conversation (AC14/AC15/AC22) is the manager's
 * `feed` — a context SIBLING of `data`, folded into the model by name
 * (`siblings`) and drawn one entry per item by `TableCellList`.
 */
export const detailUischema: DetailUischema = {
  type: "DetailLayout",
  siblings: ["feed"],
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/subject",
      i18n: "text.subject"
    },
    {
      type: "TableCellText",
      scope: "#/properties/reference",
      i18n: "text.reference"
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: { badges: STATUS_BADGES }
    },
    {
      type: "TableCellText",
      scope: "#/properties/department/properties/name",
      i18n: "text.department"
    },
    {
      type: "TableCellText",
      scope: "#/properties/contract_product/properties/product_name",
      i18n: "text.linked_product"
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
    },
    {
      type: "TableCellList",
      scope: "#/properties/feed/properties/entries",
      i18n: "text.conversation",
      options: {
        elements: [
          {
            type: "TableCellText",
            scope: "#/properties/message/properties/actor_name",
            i18n: "text.author"
          },
          {
            type: "TableCellDate",
            scope: "#/properties/message/properties/dateCreated",
            i18n: "text.date_added"
          },
          {
            type: "TableCellHtml",
            scope: "#/properties/message/properties/body",
            i18n: "text.body"
          }
        ]
      }
    }
  ]
};

/**
 * The controls this scenario can actually drive: OPENING the record's own
 * manager page (a surface-owned `navigate`, not a module action), opening the
 * record READ-ONLY in the detail overlay, and forcing a re-read of the list.
 * Every write member (`reply`/`close`/`reopen`/`setSubject`/attachments) lives
 * on the MANAGER's action map (`useTicket().useActions()`), which the
 * runtime never binds a row action to — only `useList`'s own action map is
 * (per `ListSurface.vue`'s `props.actions`), and `useTickets` carries
 * none of those names. So no MODULE write is declared here. The `open` control
 * is a different thing: a `navigate` the surface fires itself (like `detail`),
 * routing to `/useTicket/<row id>` — never a composable member, so it
 * draws no control the runtime cannot fire.
 */
export const actionsUischema: ActionsUischema = {
  type: "ActionsLayout",
  elements: [
    {
      // R6/AC1 — a hand reads only the REFERENCE on the row (never the uuid the
      // manager loads by), so this control carries the id itself and navigates
      // to the manager route: no copy-paste, no 404 from pasting a reference.
      // NOT a module action (the runtime binds none for `useTickets`) — a
      // surface-owned `navigate`, the twin of the read-only `view` below.
      type: "Action",
      name: "open",
      navigate: "/useTicket/:id",
      i18n: "action.open_ticket",
      icon: "link-external-01",
      variant: "outline",
      placement: ActionPlacementTypes.VISIBLE
    },
    {
      type: "Action",
      name: "view",
      detail: true,
      i18n: "action.view_ticket",
      icon: "eye",
      variant: "outline",
      placement: ActionPlacementTypes.VISIBLE
    },
    {
      type: "Action",
      name: "refresh",
      i18n: "action.refresh",
      icon: "refresh-cw-01",
      variant: "outline",
      placement: ActionPlacementTypes.HEADER,
      feedback: {
        success: "confirm.tickets_refreshed",
        failure: "error.tickets_refresh_failed"
      }
    }
  ]
};
