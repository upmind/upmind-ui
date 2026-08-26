// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientCompanies/client-company.presentation
 * @description How a client company DRAWS — the table, the same record as a
 * card, the read-only detail and every action's presentation and
 * precondition. Grounded field by field on the live row
 * `useClientCompanies().useContext().data` publishes (`Company` in
 * `client-company.mappers.ts`), so nothing here describes a shape the
 * composable does not produce.
 *
 * ORDERING is not here at all (`R6-28`): the collection is ordered by the
 * query schema's own `sort` enum (`name`/`created_at`), which the sort
 * control reads directly, so the toolbar and a column header cannot disagree
 * about what is orderable.
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
  { flag: "isVerified", i18n: "text.verified_label", color: "success" as const }
];

/**
 * Tax-validation status badges, drawn on the tax number row in the detail
 * overlay — mirroring the billing card's icon treatment (CompanyItem.vue),
 * with the same `meta.hasValidTax` flag the composable maps. The pending
 * state (hasTax && !hasValidTax) is the absence of the valid badge.
 */
const TAX_STATUS_BADGES = [
  {
    flag: "hasValidTax",
    i18n: "text.tax_valid_label",
    color: "success" as const
  }
];

export const tableUischema: TableUischema = {
  type: "TableLayout",
  elements: [
    // The one default company reads as the default at a glance: every row
    // carries the star, filled on that row and outlined on the rest.
    {
      type: "TableCellIcon",
      scope: "#/properties/meta/properties/isDefault",
      i18n: "text.default_label",
      options: { icon: "star-01" }
    },
    {
      type: "TableCellText",
      scope: "#/properties/name",
      i18n: "text.company"
    },
    {
      type: "TableCellText",
      scope: "#/properties/regNumber",
      i18n: "text.company_number_label"
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
 * component. The status rides the TITLE slot because that is the manage/billing
 * card's own law (`manage/Item.vue`): star, name and badges read as one line,
 * with the reg number under it.
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
      scope: "#/properties/name",
      i18n: "text.company",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: { badges: STATUS_BADGES, slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/regNumber",
      i18n: "text.company_number_label",
      options: { slot: CardSlotTypes.SUBTITLE }
    }
  ]
};

/**
 * The SAME record drawn READ-ONLY in the detail overlay — a third
 * declaration over the row already in hand, drawn through the same cell
 * renderers the table uses (`R6-36`). No `useDetail` accompanies it, so this
 * is the row-data path: the overlay shows what the list already holds, with
 * no fetch.
 *
 * Field set and order mirrors the billing card (CompanyItem.vue):
 * 1. Name + default/verified status
 * 2. Address (the joined description string)
 * 3. Company registration number
 * 4. Tax number with validation status
 */
export const detailUischema: DetailUischema = {
  type: "DetailLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/name",
      i18n: "text.company"
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: { badges: STATUS_BADGES }
    },
    {
      type: "TableCellText",
      scope: "#/properties/description",
      i18n: "text.address"
    },
    {
      type: "TableCellText",
      scope: "#/properties/regNumber",
      i18n: "text.company_number_label"
    },
    {
      type: "TableCellText",
      scope: "#/properties/tax/properties/number",
      i18n: "text.tax_number_label"
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.tax_status",
      options: { badges: TAX_STATUS_BADGES }
    }
  ]
};

/**
 * Every action the module offers, in the order they are drawn — ONE list for
 * the row and the card alike (`R6-33`), with the collection's own control
 * distinguished by the only thing that differs: it is fired with no record,
 * so it is placed in the page header (G4).
 *
 * Each name is a live member of `useClientCompanies().useActions()`; each
 * rule reads a flag the ROW itself carries, so the control state and the
 * business rule cannot disagree.
 */
export const actionsUischema: ActionsUischema = {
  type: "ActionsLayout",
  elements: [
    {
      type: "Action",
      // The control IS the capability: `ensure` takes a company and a button
      // cannot supply one, so the editor this hands off to is what collects
      // it and its save calls the same find-or-create service.
      name: "ensure",
      handoff: "add",
      i18n: "action.add_new",
      icon: "plus",
      variant: "primary",
      placement: ActionPlacementTypes.HEADER
    },
    {
      type: "Action",
      // Opens the read-only detail overlay on the row itself — no fetch,
      // since this scenario declares no `useDetail`. It sits beside `edit`:
      // read the record, then hand off to the editor from the overlay's own
      // actions.
      name: "view",
      detail: true,
      i18n: "action.view",
      icon: "eye",
      variant: "outline",
      placement: ActionPlacementTypes.VISIBLE
    },
    {
      type: "Action",
      // The collection has no update path at all — editing one company is
      // the MANAGER's job, and the row hands off to it carrying its own id.
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
        success: "confirm.company_removed",
        failure: "error.client_company_delete_failed"
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
        success: "confirm.company_set_default",
        failure: "error.client_company_set_default_failed"
      },
      rule: {
        effect: RuleEffect.HIDE,
        condition: {
          type: "LEAF",
          scope: "#/properties/meta/properties/isDefault",
          expectedValue: true
        }
      }
    }
  ]
};
