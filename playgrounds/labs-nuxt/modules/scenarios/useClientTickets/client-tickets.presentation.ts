// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientTickets/client-tickets.presentation
 * @description How a client's support ticket DRAWS — the collection as a
 * table, and ONE record READ-ONLY in the detail overlay. Grounded field by
 * field on the live row `useClientTickets().useContext().data` publishes
 * (`Ticket` in `tickets.types.ts`), so nothing here describes a shape the
 * composable does not produce.
 *
 * NO EDITOR. The module's writes (`reply`, `close`, `reopen`, `setSubject`,
 * attachments) live on the per-record MANAGER's own action map
 * (`useClientTicket().useActions()`), and `useClientTickets` (the collection
 * this page binds as `useList`) carries no matching generic write the
 * runtime's handoff/form-flow surface can drive (no `update`/`resolve`
 * member), so no `handoff` is declared here.
 *
 * NO `useDetail` either — see `client-tickets.scenario.ts`'s module docblock:
 * the manager addresses its ticket through a ruled `.for('ticket', id)`
 * context (R1), which the runtime's generic single-read wiring cannot drive.
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

export const tableUischema: TableUischema = {
  type: "TableLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/reference",
      i18n: "text.reference"
    },
    {
      type: "TableCellText",
      scope: "#/properties/subject",
      i18n: "text.subject",
      options: { width: TableColumnWidthTypes.HALF }
    },
    {
      type: "TableCellText",
      scope: "#/properties/status/properties/name",
      i18n: "text.status"
    },
    {
      type: "TableCellText",
      scope: "#/properties/department/properties/name",
      i18n: "text.department"
    },
    {
      // R12/AC10 — the co-mingled-visibility receipt: a ticket delegated in
      // to this client reads `is_delegated_object: true` on the SAME list a
      // client's own tickets ride, never a separate feed.
      type: "TableCellIcon",
      scope: "#/properties/is_delegated_object",
      i18n: "text.delegated_label",
      options: { icon: "users-01" }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/updated_at",
      i18n: "text.date_updated"
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
      type: "TableCellIcon",
      scope: "#/properties/is_delegated_object",
      i18n: "text.delegated_label",
      options: { icon: "users-01", slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/status/properties/name",
      i18n: "text.status",
      options: { slot: CardSlotTypes.SUBTITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/department/properties/name",
      i18n: "text.department",
      options: { slot: CardSlotTypes.SUBTITLE }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/updated_at",
      i18n: "text.date_updated",
      options: { slot: CardSlotTypes.BODY }
    }
  ]
};

/**
 * ONE ticket drawn READ-ONLY — the same cell renderers the table uses
 * (`R6-36`), over the same row the list already fetched (no `useDetail`, per
 * this file's module docblock). `contract_product` (AC13) and `settings.lock`
 * (AC24/AC27's own guard) are declared here rather than in the table because
 * they are read on OPEN, not scanned across every row. The merged
 * message/status feed (AC14/AC15/AC22) is NOT drawn here — it is not a flat
 * field on `Ticket`, and this scenario declares no surface for it.
 */
export const detailUischema: DetailUischema = {
  type: "DetailLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/reference",
      i18n: "text.reference"
    },
    {
      type: "TableCellText",
      scope: "#/properties/subject",
      i18n: "text.subject"
    },
    {
      type: "TableCellText",
      scope: "#/properties/status/properties/name",
      i18n: "text.status"
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
      type: "TableCellIcon",
      scope: "#/properties/settings/properties/lock",
      i18n: "text.locked_label",
      options: { icon: "lock-01" }
    },
    {
      type: "TableCellIcon",
      scope: "#/properties/is_delegated_object",
      i18n: "text.delegated_label",
      options: { icon: "users-01" }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/created_at",
      i18n: "text.date_added"
    },
    {
      type: "TableCellDate",
      scope: "#/properties/updated_at",
      i18n: "text.date_updated"
    }
  ]
};

/**
 * The two controls this scenario can actually drive: opening the record
 * READ-ONLY, and forcing a re-read of the list. Every write member
 * (`reply`/`close`/`reopen`/`setSubject`/attachments) lives on the MANAGER's
 * action map (`useClientTicket().useActions()`), which the runtime never
 * binds a row action to — only `useList`'s own action map is (per
 * `ListSurface.vue`'s `props.actions`), and `useClientTickets` carries none
 * of those names. Declaring them here would draw a control the runtime can
 * never fire; this module docblock names the gap rather than faking the
 * wiring.
 */
export const actionsUischema: ActionsUischema = {
  type: "ActionsLayout",
  elements: [
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
