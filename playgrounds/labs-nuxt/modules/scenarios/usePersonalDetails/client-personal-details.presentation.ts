// -----------------------------------------------------------------------------
/**
 * @module scenarios/usePersonalDetails/client-personal-details.presentation
 * @description How a client's own profile DRAWS — one row per profile field
 * (native, then custom), through the same cell renderers every other module
 * uses. Grounded field by field on the live row
 * `usePersonalDetails().useContext().data` publishes — `ProfileField`
 * (`client-personal-details.types.ts:146-154`): `code`, `title`, `value`,
 * `meta.isCustomField`. A column exists because it was declared, never
 * because a key happened to be on the row (C15).
 *
 * This is not a collection pretending to be one (design.md D3):
 * `usePersonalDetails.context.ts:89-93` genuinely publishes an array, wrapped
 * in `useCollection` for `findOne`/`getOne`.
 *
 * ORDERING is not here at all (`R6-28`): this module owns no criteria and no
 * sort enum (`parity.yaml` `not_owed`) — the row order is the composable's
 * own definition order.
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
 * A badge marking a row as a custom field rather than a native profile field.
 */
const FIELD_TYPE_BADGES = [
  {
    flag: "isCustomField",
    i18n: "text.custom_field_label",
    color: "info" as const
  }
];

export const tableUischema: TableUischema = {
  type: "TableLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/title",
      i18n: "text.field_name",
      options: { width: TableColumnWidthTypes.THIRD }
    },
    {
      type: "TableCellText",
      scope: "#/properties/value",
      i18n: "text.field_value"
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: { badges: FIELD_TYPE_BADGES }
    }
  ]
};

/**
 * The SAME record, drawn as a card — a second declaration, never a second
 * component. The field name rides the TITLE slot, the value sits in the BODY.
 */
export const cardUischema: CardUischema = {
  type: "CardLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/title",
      i18n: "text.field_name",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: { badges: FIELD_TYPE_BADGES, slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/value",
      i18n: "text.field_value",
      options: { slot: CardSlotTypes.BODY }
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
      scope: "#/properties/title",
      i18n: "text.field_name"
    },
    {
      type: "TableCellText",
      scope: "#/properties/value",
      i18n: "text.field_value"
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: { badges: FIELD_TYPE_BADGES }
    }
  ]
};

/**
 * The controls this module offers — collection-level (`R6-33`) and row-level:
 * a profile-field ROW carries no client id of its own to retarget an edit onto
 * — `ProfileField.id` is the FIELD's identity, never the client's — so
 * editing the whole profile is a single HEADER control, and `refresh`
 * (a live member of `usePersonalDetails().useActions()`) re-reads it
 * (AC-52). A `view` action opens the row's read-only detail overlay; a row-level
 * `edit` hands off to the profile editor NARROWED to that one field via the
 * `fieldScope` pointer — the row's `code` property names the field, and the
 * editor draws only that control.
 */
export const actionsUischema: ActionsUischema = {
  type: "ActionsLayout",
  elements: [
    {
      type: "Action",
      name: "edit",
      handoff: "edit",
      i18n: "action.edit",
      icon: "edit-01",
      color: "primary",
      variant: "solid",
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
      name: "editField",
      handoff: "editField",
      i18n: "action.edit",
      icon: "edit-01",
      variant: "outline",
      placement: ActionPlacementTypes.VISIBLE
    },
    {
      type: "Action",
      name: "refresh",
      i18n: "action.refresh",
      icon: "refresh-cw-01",
      variant: "outline",
      placement: ActionPlacementTypes.HEADER
    }
  ]
};
