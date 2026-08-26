// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientAddresses/client-address.presentation
 * @description How a client address DRAWS — the table, the same record as a
 * card, the read-only detail overlay, and every action's presentation and
 * precondition. Grounded field by field on the live row
 * `useClientAddresses().useContext().data` publishes (`Address` in
 * `client-address.types.ts`), so nothing here describes a shape the composable
 * does not produce.
 *
 * Excluded fields: `id` (system value, stays reachable through the binding's
 * `identifier`); `clientId` (system reference); `address` object (flattened
 * into `description`); individual address components (consumed in
 * `description`); `meta.canDelete` (gate only, not a display field).
 *
 * Status column DROPPED: the Address model has only `meta.isVerified`, and
 * unverified rows showed nothing — a column that is empty half the time
 * carries no meaning. See `client-email.presentation.ts` for the standard
 * (two independent flags: isVerified + isBounced).
 *
 * ORDERING is not here at all (`R6-28`): the collection is ordered by the query
 * schema's own `sort` enum, which the control reads directly.
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
      scope: "#/properties/description",
      i18n: "text.address"
    }
  ]
};

/**
 * The SAME record, drawn as a card — a second declaration, never a second
 * component. Star and description read as one line, with the name under it.
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
      scope: "#/properties/description",
      i18n: "text.address",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/name",
      i18n: "text.address_name",
      options: { slot: CardSlotTypes.SUBTITLE }
    }
  ]
};

/**
 * The SAME record drawn READ-ONLY in the detail overlay — a third declaration
 * over the row already in hand, drawn through the same cell renderers the table
 * uses (`R6-36`). No `useDetail` accompanies it, so this is the row-data path:
 * the overlay shows what the list already holds, with no fetch.
 */
export const detailUischema: DetailUischema = {
  type: "DetailLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/name",
      i18n: "text.address_name"
    },
    {
      type: "TableCellText",
      scope: "#/properties/description",
      i18n: "text.address"
    }
  ]
};

/**
 * Every action the module offers, in the order they are drawn — ONE list for
 * the row and the card alike (`R6-33`), with the collection's own control
 * distinguished by the only thing that differs: it is fired with no record, so
 * it is placed in the page header (G4).
 *
 * Each name is a live member of `useClientAddresses().useActions()`; each rule
 * reads a flag the ROW itself carries, so the control state and the business
 * rule cannot disagree (C11). Remove is DISABLED rather than hidden — the row
 * says it cannot be deleted, which is worth showing; setDefault is HIDDEN,
 * since an already-default address has nothing to offer.
 */
export const actionsUischema: ActionsUischema = {
  type: "ActionsLayout",
  elements: [
    {
      type: "Action",
      name: "ensure",
      handoff: "add",
      i18n: "action.add_new",
      icon: "plus",
      variant: "primary",
      placement: ActionPlacementTypes.HEADER
    },
    {
      type: "Action",
      name: "view",
      detail: true,
      i18n: "action.view",
      icon: "eye",
      variant: "outline",
      placement: ActionPlacementTypes.VISIBLE
    },
    {
      type: "Action",
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
        success: "confirm.address_removed",
        failure: "error.client_address_delete_failed"
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
        success: "confirm.address_set_default",
        failure: "error.client_address_set_default_failed"
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
        success: "confirm.addresses_refreshed",
        failure: "error.client_addresses_refresh_failed"
      }
    }
  ]
};
