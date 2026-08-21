// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientEmails/client-email.presentation
 * @description How a client email DRAWS — the table, the same record as a card,
 * and every action's presentation and precondition. Grounded field by field on
 * the live row `useClientEmails().useContext().data` publishes (`Email` in
 * `client-email.mappers.ts`), so nothing here describes a shape the composable
 * does not produce.
 *
 * What is deliberately NOT declared is the point of the declaration: `id` is a
 * system value a human never needs as a column (C15) and stays reachable
 * through the binding's `identifier`; `title` is the same value as `email`;
 * `description` is always empty; and `type` is the `const 1` the server fixes
 * and the mapper's own docblock calls deprecated. A column exists because it
 * was declared, never because a key happened to be on the row.
 *
 * ORDERING is not here at all (`R6-28`): the collection is ordered by the query
 * schema's own `sort` enum, which the control reads directly, so the toolbar
 * and a column header cannot disagree about what is orderable.
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

/**
 * The row's status flags, drawn as badges — the same `meta` C11's rules gate on.
 * `isDefault` is NOT among them: default-ness is the star cell's one job, and a
 * badge repeating it would be the same fact told twice.
 */
const STATUS_BADGES = [
  {
    flag: "isVerified",
    i18n: "text.verified_label",
    color: "success" as const
  },
  { flag: "isBounced", i18n: "text.bounced_label", color: "danger" as const }
];

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
      scope: "#/properties/email",
      i18n: "text.email_address"
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: { badges: STATUS_BADGES }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/bouncedAt",
      i18n: "text.date_bounced"
    }
  ]
};

/**
 * The SAME record, drawn as a card — a second declaration, never a second
 * component. The status rides the TITLE slot because that is the manage/billing
 * card's own law (`manage/Item.vue`): star, address and badges read as one line,
 * with the muted line under it.
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
      scope: "#/properties/email",
      i18n: "text.email_address",
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
      scope: "#/properties/bouncedAt",
      i18n: "text.date_bounced",
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
      scope: "#/properties/email",
      i18n: "text.email_address"
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: { badges: STATUS_BADGES }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/bouncedAt",
      i18n: "text.date_bounced"
    }
  ]
};

/**
 * Every action the module offers, in the order they are drawn — ONE list for
 * the row and the card alike (`R6-33`), with the collection's own control
 * distinguished by the only thing that differs: it is fired with no record, so
 * it is placed in the page header (G4).
 *
 * Each name is a live member of `useClientEmails().useActions()`; each rule
 * reads a flag the ROW itself carries, so the control state and the business
 * rule cannot disagree (C11). Remove is DISABLED rather than hidden — the row
 * says it cannot be deleted, which is worth showing; verify and set-default are
 * HIDDEN, since an already-verified or already-default address has nothing to
 * offer.
 */
export const actionsUischema: ActionsUischema = {
  type: "ActionsLayout",
  elements: [
    {
      type: "Action",
      // The control IS the capability: `ensure` takes an address and a button
      // cannot supply one, so the editor this hands off to is what collects it
      // and its save calls the same find-or-create service (C2). Named for what
      // it does rather than for the dialog it opens, so a scenario step naming
      // the capability presses this control the way a hand does.
      name: "ensure",
      handoff: "add",
      i18n: "action.add_new",
      icon: "plus",
      color: "primary",
      variant: "solid",
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
      // The collection has no update path at all — editing one address is the
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
      color: "danger",
      variant: "outline",
      placement: ActionPlacementTypes.VISIBLE,
      feedback: {
        success: "confirm.email_removed",
        failure: "error.client_email_delete_failed"
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
        success: "confirm.email_set_default",
        failure: "error.client_email_set_default_failed"
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
      name: "verify",
      i18n: "action.verify",
      icon: "shield-tick",
      variant: "outline",
      placement: ActionPlacementTypes.OVERFLOW,
      feedback: {
        success: "confirm.email_verification_sent",
        failure: "error.client_email_verify_failed"
      },
      rule: {
        effect: RuleEffect.HIDE,
        condition: {
          type: "LEAF",
          scope: "#/properties/meta/properties/isVerified",
          expectedValue: true
        }
      }
    }
  ]
};
