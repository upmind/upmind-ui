// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientEmails/client-emails.presentation
 * @description How a client email DRAWS — the table row, the same row as a
 * card, and every action's presentation and precondition. Grounded field by
 * field on the live row `useClientEmails().useContext().data` publishes
 * (`Email` in `client-email.mappers.ts`), so nothing here describes a shape the
 * composable does not produce.
 *
 * What is deliberately NOT declared is the point of the declaration: `id` is a
 * system value a human never needs as a column (C15) and stays reachable
 * through the binding's `identifier`; `title` is the same value as `email`;
 * `description` is always empty; and `type` is the `const 1` the server fixes
 * and the mapper's own docblock calls deprecated. A column exists because it
 * was declared, never because a key happened to be on the row.
 *
 * `sortable` names the wire field from the query schema's own `sort.field`
 * enum, which is why Status sorts by `default` — the marker column has no
 * header to click, so that column is where the enum's `default` field stays
 * reachable. `bouncedAt` declares none: the enum offers `created_at`, never a
 * bounce date, and a header the API would refuse is a header the user is not
 * invited to click.
 */

import { RuleEffect } from "@jsonforms/core";
import {
  ActionPlacementTypes,
  CardSlotTypes,
  RowCellTypes
} from "../runtime/scenario.types";
import type { RowUischema, ScenarioAction } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/**
 * The row's status flags, drawn as badges — the same `meta` C11's rules gate on.
 * `isDefault` is NOT among them: default-ness is the marker column's one job,
 * and a badge repeating it would be the same fact told twice.
 */
const STATUS_BADGES = [
  {
    flag: "isVerified",
    i18n: "text.verified_label",
    color: "success" as const
  },
  { flag: "isBounced", i18n: "text.bounced_label", color: "danger" as const }
];

export const rowUischema: RowUischema = {
  type: "HorizontalLayout",
  options: {
    // C12 — the one default row reads as the default at a glance: every row
    // carries the star, filled on that row and outlined on the rest.
    marker: {
      scope: "#/properties/meta/properties/isDefault",
      icon: "star-01",
      marked: "Solid",
      unmarked: "Line"
    }
  },
  elements: [
    {
      type: "Control",
      scope: "#/properties/email",
      i18n: "text.email_address",
      options: { cell: RowCellTypes.TEXT, sortable: "email" }
    },
    {
      type: "Control",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: {
        cell: RowCellTypes.BADGES,
        badges: STATUS_BADGES,
        sortable: "default"
      }
    },
    {
      type: "Control",
      scope: "#/properties/bouncedAt",
      i18n: "text.date_bounced",
      options: { cell: RowCellTypes.DATE }
    }
  ]
};

/** The SAME row, drawn as a card — a second declaration, never a second component. */
export const cardUischema: RowUischema = {
  type: "VerticalLayout",
  options: rowUischema.options,
  elements: [
    {
      type: "Control",
      scope: "#/properties/email",
      i18n: "text.email_address",
      options: { cell: RowCellTypes.TEXT, slot: CardSlotTypes.TITLE }
    },
    {
      type: "Control",
      scope: "#/properties/bouncedAt",
      i18n: "text.date_bounced",
      options: { cell: RowCellTypes.DATE, slot: CardSlotTypes.SUBTITLE }
    },
    {
      type: "Control",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: {
        cell: RowCellTypes.BADGES,
        badges: STATUS_BADGES,
        slot: CardSlotTypes.BODY
      }
    }
  ]
};

/**
 * The per-row actions, in the order they are offered. Each name is a live
 * member of `useClientEmails().useActions()`; each rule reads a flag the ROW
 * itself carries, so the control state and the business rule cannot disagree
 * (C11). Remove is DISABLED rather than hidden — the row says it cannot be
 * deleted, which is worth showing; verify and set-default are HIDDEN, since an
 * already-verified or already-default address has nothing to offer.
 */
export const rowActions: ScenarioAction[] = [
  {
    name: "edit",
    i18n: "action.edit",
    icon: "edit-01",
    variant: "outline",
    placement: ActionPlacementTypes.VISIBLE,
    // The collection has no update path at all — editing one address is the
    // MANAGER's job, and the row hands off to it carrying its own id (C1).
    handoff: "edit"
  },
  {
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
];

export const collectionActions: ScenarioAction[] = [
  {
    name: "add",
    i18n: "action.add_new",
    icon: "plus",
    color: "primary",
    variant: "solid",
    placement: ActionPlacementTypes.VISIBLE,
    // `ensure` takes an address; a button cannot supply one. The editor the
    // handoff opens is what collects it, and its save calls the same
    // find-or-create service the collection's own action would have (C2).
    handoff: "add"
  }
];
