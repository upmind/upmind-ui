// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientCustomFields/client-custom-fields.presentation
 * @description How a client's custom field definition DRAWS — the table, the
 * same record as a card, and read-only in the detail overlay. Grounded field
 * by field on the live row `useClientCustomFields().useContext().data`
 * publishes (`CustomField` in `client-custom-fields.types.ts`), so nothing
 * here describes a shape the composable does not produce.
 *
 * ORDERING is not here at all (`R6-28`): the collection is ordered by the
 * query schema's own `sort` enum, which the control reads directly.
 *
 * No mutation surface exists (D8 — no `useMutate`), so `actionsUischema`
 * offers only the read-only `view` and `refresh` controls, mirroring
 * `useClientReceivedEmails`'s own no-mutate scenario.
 *
 * What is deliberately NOT declared is the point of the declaration: `id` and
 * `code` are system values a human never needs as columns (C15); `order` is
 * internal sort metadata. A column exists because it was declared, never
 * because a key happened to be on the row.
 */

import { ActionPlacementTypes, CardSlotTypes } from "../runtime/scenario.types";
import type {
  ActionsUischema,
  CardUischema,
  DetailUischema,
  TableUischema
} from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/**
 * The row's status flags, drawn as badges. `isRequired` is shown; other meta
 * flags (`isReadOnly`, `isHidden`, etc.) are internal state.
 */
const STATUS_BADGES = [
  {
    flag: "isReadOnly",
    i18n: "text.readonly_label",
    color: "info" as const
  },
  {
    flag: "isRequired",
    i18n: "text.required_label",
    color: "warning" as const
  }
];

export const tableUischema: TableUischema = {
  type: "TableLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/name",
      i18n: "text.field_name"
    },
    {
      type: "TableCellText",
      scope: "#/properties/type",
      i18n: "text.field_type"
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
 * component. The field name rides the TITLE slot, the type in SUBTITLE.
 */
export const cardUischema: CardUischema = {
  type: "CardLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/name",
      i18n: "text.field_name",
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
      scope: "#/properties/type",
      i18n: "text.field_type",
      options: { slot: CardSlotTypes.SUBTITLE }
    }
  ]
};

/**
 * The SAME record drawn READ-ONLY in the detail overlay — a third
 * declaration over the row already in hand, drawn through the same cell
 * renderers the table uses (`R6-36`). No `useDetail` accompanies it, so this
 * is the row-data path: the overlay shows what the list already holds.
 */
export const detailUischema: DetailUischema = {
  type: "DetailLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/name",
      i18n: "text.field_name"
    },
    {
      type: "TableCellText",
      scope: "#/properties/type",
      i18n: "text.field_type"
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
 * The controls this module offers: view opens the record READ-ONLY in the
 * detail overlay (no fetch — the row's data fills it), refresh re-reads the
 * collection. The module has no mutation surface, so no edit/remove actions.
 */
export const actionsUischema: ActionsUischema = {
  type: "ActionsLayout",
  elements: [
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
      name: "refresh",
      i18n: "action.refresh",
      icon: "refresh-cw-01",
      variant: "outline",
      placement: ActionPlacementTypes.HEADER
    }
  ]
};
