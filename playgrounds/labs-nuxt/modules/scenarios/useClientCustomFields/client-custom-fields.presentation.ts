// -----------------------------------------------------------------------------
/**
 * @module scenarios/useClientCustomFields/client-custom-fields.presentation
 * @description How a client's custom field definition DRAWS — the table, the
 * same record as a card, and read-only in the detail overlay. Grounded field
 * by field on the live row `useClientCustomFields().useContext().data`
 * publishes (`CustomField` in `client-custom-fields.types.ts`), so nothing
 * here describes a shape the composable does not produce. The catalogue the
 * scope bar selects swaps only WHICH rows `useContext().data` holds — every
 * renderer here is catalogue-blind.
 *
 * ORDERING is not here at all (`R6-28`): the collection is ordered by the
 * query schema's own `sort` enum, which the control reads directly. `order`
 * IS declared below as a plain column — a display of the field's own
 * position, never a sort control of its own.
 *
 * No mutation surface exists (D8 — no `useMutate`), so `actionsUischema`
 * offers no create/edit/remove. `view` opens the read overlay; `refresh`,
 * `invalidate` and `reset` each press one of the collection's own cache-life
 * members (`useClientCustomFields.actions.ts`) for the same reason `view`
 * opens a read — a driveable page presses what the composable exposes, and
 * those three are how a hand proves the per-catalogue cache isolation.
 * `destroy` presses the composable's own teardown member, kept OVERFLOW as
 * the one control that ends the page's own instance rather than refreshing it.
 *
 * What is deliberately NOT declared is the point of the declaration: `id` is a
 * system value a human never needs as a column (C15). `code` and `typeId` are
 * read-only in the DETAIL only — a hand trusts the type filter by seeing the
 * numeric `typeId` a record actually carries, but a column of them is noise. A
 * column exists because it was declared, never because a key happened to be on
 * the row.
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
 * The row's status flags, drawn as badges — the four `CustomField.meta`
 * booleans this declaration surfaces. The rest (`isDisabled`, `isEditable`,
 * `showOnOrderForm`, `showOnInvoice`, `displayContexts`) stay undeclared
 * internal state.
 */
const STATUS_BADGES = [
  {
    flag: "isRequired",
    i18n: "text.required_label",
    color: "warning" as const
  },
  {
    flag: "isReadOnly",
    i18n: "text.readonly_label",
    color: "info" as const
  },
  {
    flag: "isHidden",
    i18n: "text.hidden_label",
    color: "neutral" as const
  },
  {
    flag: "isUserOnly",
    i18n: "text.user_only_label",
    color: "neutral" as const
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
      type: "TableCellText",
      scope: "#/properties/order",
      i18n: "text.field_order"
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
 * component. The field name and status badges ride the TITLE slot, the type on
 * SUBTITLE, the order on BODY.
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
    },
    {
      type: "TableCellText",
      scope: "#/properties/order",
      i18n: "text.field_order",
      options: { slot: CardSlotTypes.BODY }
    }
  ]
};

/**
 * The SAME record drawn READ-ONLY in the detail overlay — a third
 * declaration over the row already in hand, drawn through the same cell
 * renderers the table uses (`R6-36`). No `useDetail` accompanies it, so this
 * is the row-data path: the overlay shows what the list already holds. Adds
 * `code` and `typeId` over the table's four — read-only fields a hand needs to
 * trust the record's identity and the type filter, never columns a list gains
 * from.
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
      type: "TableCellText",
      scope: "#/properties/order",
      i18n: "text.field_order"
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: { badges: STATUS_BADGES }
    },
    {
      type: "TableCellText",
      scope: "#/properties/code",
      i18n: "text.field_code"
    },
    {
      type: "TableCellText",
      scope: "#/properties/typeId",
      i18n: "text.field_type_id"
    }
  ]
};

/**
 * The controls this module offers, each named for the live member it presses.
 * `view` opens the record READ-ONLY (no fetch — the row's data fills it).
 * `refresh`, `invalidate` and `reset` each press the matching member on
 * `useClientCustomFields().useActions()`, HEADER-placed as collection-level
 * controls fired with no row. `destroy` presses the composable's own teardown
 * member, OVERFLOW-placed as the one control that ends the page's instance
 * rather than refreshing it. No control carries a `rule`: the module has no
 * mutation surface, so nothing here is capability-gated.
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
    },
    {
      type: "Action",
      name: "invalidate",
      i18n: "action.invalidate",
      icon: "loading-01",
      variant: "outline",
      placement: ActionPlacementTypes.HEADER
    },
    {
      type: "Action",
      name: "reset",
      i18n: "action.reset",
      icon: "x-close",
      variant: "outline",
      placement: ActionPlacementTypes.HEADER
    },
    {
      type: "Action",
      name: "destroy",
      i18n: "action.destroy",
      icon: "trash-01",
      variant: "outline",
      placement: ActionPlacementTypes.OVERFLOW
    }
  ]
};
