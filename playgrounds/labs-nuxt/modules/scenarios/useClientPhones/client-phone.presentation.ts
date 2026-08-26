// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientPhones/client-phone.presentation
 * @description How a client phone DRAWS — the table, the same record as a card,
 * the read-only detail overlay, and every action's presentation and
 * precondition. Grounded field by field on the live row
 * `useClientPhones().useContext().data` publishes (`Phone` in
 * `client-phone.types.ts`), so nothing here describes a shape the composable
 * does not produce.
 *
 * Excluded fields: `id` (system value, stays reachable through the binding's
 * `identifier`); `phone.*` (parse components — number, country,
 * nationalNumber, countryCallingCode); `description` (redundant with title);
 * `type` (server-fixed const, read-only); `meta.canDelete` (gate only, not a
 * display field).
 *
 * ORDERING is not here at all: the collection is ordered by the query schema's
 * own `sort` enum (`["created_at"]`), which the control reads directly.
 */

import { RuleEffect } from "@jsonforms/core";
import { ActionPlacementTypes, CardSlotTypes } from "../runtime/scenario.types";
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
    // C12 — the one default row reads as the default at a glance: every row
    // carries the star, filled on that row and outlined on the rest.
    {
      type: "TableCellIcon",
      scope: "#/properties/meta/properties/isDefault",
      i18n: "text.default_label",
      options: { icon: "star-01" }
    },
    {
      type: "TableCellText",
      scope: "#/properties/title",
      i18n: "text.phone"
    }
  ]
};

/**
 * The SAME record, drawn as a card — a second declaration, never a second
 * component. The status rides the TITLE slot because that is the manage/billing
 * card's own law (`manage/Item.vue`): star and phone read as one line.
 */
export const cardUischema: CardUischema = {
  type: "CardLayout",
  elements: [
    {
      type: "TableCellIcon",
      scope: "#/properties/meta/properties/isDefault",
      i18n: "text.default_label",
      options: { icon: "star-01", slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/title",
      i18n: "text.phone",
      options: { slot: CardSlotTypes.TITLE }
    }
  ]
};

/**
 * The SAME record drawn READ-ONLY in the detail overlay — a third declaration
 * over the row already in hand, drawn through the same cell renderers the table
 * uses. No `useDetail` accompanies it, so this is the row-data path: the
 * overlay shows what the list already holds, with no fetch.
 */
export const detailUischema: DetailUischema = {
  type: "DetailLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/title",
      i18n: "text.phone"
    }
  ]
};

/**
 * Every action the module offers, in the order they are drawn — ONE list for
 * the row and the card alike (`R6-33`), with the collection's own control
 * distinguished by the only thing that differs: it is fired with no record, so
 * it is placed in the page header (G4).
 *
 * Each name is a live member of `useClientPhones().useActions()`; each rule
 * reads a flag the ROW itself carries, so the control state and the business
 * rule cannot disagree (C11). Remove is DISABLED rather than hidden — the row
 * says it cannot be deleted, which is worth showing; setDefault is HIDDEN,
 * since an already-default phone has nothing to offer.
 */
export const actionsUischema: ActionsUischema = {
  type: "ActionsLayout",
  elements: [
    {
      type: "Action",
      // The control IS the capability: `ensure` takes a phone and a button
      // cannot supply one, so the editor this hands off to is what collects it
      // and its save calls the same find-or-create service (C2). Named for what
      // it does rather than for the dialog it opens, so a scenario step naming
      // the capability presses this control the way a hand does.
      name: "ensure",
      handoff: "add",
      i18n: "action.add_new",
      icon: "plus",
      variant: "primary",
      placement: ActionPlacementTypes.HEADER
    },
    {
      type: "Action",
      // Opens the read-only detail overlay on the row itself — no fetch, since
      // this scenario declares no `useDetail`. It sits beside `edit`: read the
      // record, then hand off to the editor from the overlay's own actions.
      name: "view",
      detail: true,
      i18n: "action.view",
      icon: "eye",
      variant: "outline",
      placement: ActionPlacementTypes.VISIBLE
    },
    {
      type: "Action",
      // The collection has no update path at all — editing one phone is the
      // MANAGER's job, and the row hands off to it carrying its own id (C1).
      name: "edit",
      handoff: "edit",
      i18n: "action.edit",
      icon: "edit-01",
      variant: "outline",
      placement: ActionPlacementTypes.VISIBLE
    },
    {
      type: "Action",
      name: "remove",
      i18n: "action.remove",
      icon: "trash-01",

      placement: ActionPlacementTypes.VISIBLE,
      feedback: {
        success: "confirm.phone_removed",
        failure: "error.client_phone_delete_failed"
      },
      rule: {
        effect: RuleEffect.DISABLE,
        condition: {
          type: "LEAF",
          scope: "#/properties/meta/properties/canDelete",
          expectedValue: false
        }
      }
    },
    {
      type: "Action",
      name: "setDefault",
      i18n: "action.set_as_default",
      icon: "star-01",
      variant: "outline",
      placement: ActionPlacementTypes.OVERFLOW,
      feedback: {
        success: "confirm.phone_set_default",
        failure: "error.client_phone_set_default_failed"
      },
      rule: {
        effect: RuleEffect.HIDE,
        condition: {
          type: "LEAF",
          scope: "#/properties/meta/properties/isDefault",
          expectedValue: true
        }
      }
    },
    {
      type: "Action",
      name: "refresh",
      i18n: "action.refresh",
      icon: "refresh-cw-01",
      variant: "outline",
      placement: ActionPlacementTypes.OVERFLOW,
      feedback: {
        success: "confirm.phones_refreshed",
        failure: "error.client_phones_refresh_failed"
      }
    }
  ]
};
