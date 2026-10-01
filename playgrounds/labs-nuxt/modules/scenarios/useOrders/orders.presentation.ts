// -----------------------------------------------------------------------------
/**
 * @module scenarios/useOrders/orders.presentation
 * @description How a client order row draws: the table, the card, the read-only
 * detail overlay and the row actions. The collection publishes the RAW `IOrder`
 * record (D-2, no `select` mapper — `useOrders.context.ts`), so every
 * scope below points at a raw record field (`orders.row-shape` pins the
 * field set): `number`, `status`, `total_amount_formatted`,
 * `unpaid_amount_formatted`, `create_datetime` and `products_count`. Dates are
 * raw timestamp strings, not `useDate` descriptors, so each draws through
 * `TableCellText` rather than `TableCellDate`.
 *
 * NO DELEGATED COLUMN. The marker is `!parentClientId && !!delegate_related`, a
 * single raw boolean. `TableCellBadges` needs an OBJECT scope keyed by the flag
 * (the `/useInvoices` twin scopes its mapped `attribution` object); the only
 * object carrying `delegate_related` is the row root, and a `#` scope resolves
 * to the empty data path, which gives the column an empty id and breaks the
 * table. The raw `IOrder` row (D-2, no mapper) carries no clean badge object, so
 * the marker is not a list column: it lives in the MANAGER view, where
 * `useOrder` publishes `meta.isDelegated` (`order-is-delegated`).
 *
 * The detail overlay fetches: `orders.scenario.ts` declares
 * `useDetail: useOrder`, so `view` boots the manager `.withId(<row.id>)`.
 * The manager publishes its record as `data` (`useOrder.context.ts`), the
 * overlay's own default feed, so the detail element list reads the record fields
 * directly and declares no `siblings`.
 *
 * NO EDITOR. The collection has no generic write — pay and cancel are the
 * MANAGER's own (`useOrder`), driven on its self-drawn page, so no
 * `handoff` is declared here.
 *
 * FILTER, SORT AND PAGER are not declared here: the runtime draws them straight
 * off `useOrders().useContext().schemas.query` and `.pagination`.
 */

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
    {
      type: "TableCellText",
      scope: "#/properties/number",
      i18n: "labs.orders_col_number"
    },
    {
      type: "TableCellText",
      scope: "#/properties/status/properties/name",
      i18n: "labs.orders_col_status"
    },
    {
      type: "TableCellText",
      scope: "#/properties/total_amount_formatted",
      i18n: "labs.orders_col_total"
    },
    {
      type: "TableCellText",
      scope: "#/properties/unpaid_amount_formatted",
      i18n: "labs.orders_col_unpaid"
    },
    {
      type: "TableCellText",
      scope: "#/properties/create_datetime",
      i18n: "labs.orders_col_created"
    },
    {
      type: "TableCellText",
      scope: "#/properties/products_count",
      i18n: "labs.orders_col_items"
    }
  ]
};

export const cardUischema: CardUischema = {
  type: "CardLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/number",
      i18n: "labs.orders_col_number",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/status/properties/name",
      i18n: "labs.orders_col_status",
      options: { slot: CardSlotTypes.SUBTITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/total_amount_formatted",
      i18n: "labs.orders_col_total",
      options: { slot: CardSlotTypes.BODY }
    },
    {
      type: "TableCellText",
      scope: "#/properties/unpaid_amount_formatted",
      i18n: "labs.orders_col_unpaid",
      options: { slot: CardSlotTypes.BODY }
    },
    {
      type: "TableCellText",
      scope: "#/properties/products_count",
      i18n: "labs.orders_col_items",
      options: { slot: CardSlotTypes.BODY }
    }
  ]
};

/**
 * ONE order drawn READ-ONLY in the detail overlay — the manager's own fetch
 * (`useDetail: useOrder`). The manager publishes its record as `data`, the
 * overlay's default feed, so each element scopes the record field directly.
 */
export const detailUischema: DetailUischema = {
  type: "DetailLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/number",
      i18n: "labs.orders_col_number"
    },
    {
      type: "TableCellText",
      scope: "#/properties/status/properties/name",
      i18n: "labs.orders_col_status"
    },
    {
      type: "TableCellText",
      scope: "#/properties/total_amount_formatted",
      i18n: "labs.orders_col_total"
    },
    {
      type: "TableCellText",
      scope: "#/properties/unpaid_amount_formatted",
      i18n: "labs.orders_col_unpaid"
    },
    {
      type: "TableCellText",
      scope: "#/properties/create_datetime",
      i18n: "labs.orders_col_created"
    },
    {
      type: "TableCellText",
      scope: "#/properties/paid_datetime",
      i18n: "labs.orders_col_paid"
    },
    {
      type: "TableCellText",
      scope: "#/properties/due_date",
      i18n: "labs.orders_col_due"
    },
    {
      type: "TableCellText",
      scope: "#/properties/cancellation_datetime",
      i18n: "labs.orders_col_cancelled"
    },
    {
      type: "TableCellText",
      scope: "#/properties/products_count",
      i18n: "labs.orders_col_items"
    }
  ]
};

/**
 * The controls this scenario can drive: opening the row's own manager page
 * (`open`, a surface-owned `navigate`) and opening it READ-ONLY in the detail
 * overlay (`view`). Pay and cancel live on the MANAGER's action map, which the
 * runtime never binds a row action to — that surface is `useOrder`'s own
 * self-drawn page.
 */
export const actionsUischema: ActionsUischema = {
  type: "ActionsLayout",
  elements: [
    {
      type: "Action",
      name: "open",
      navigate: "/useOrder/:id",
      i18n: "action.open_order",
      icon: "link-external-01",
      variant: "outline",
      placement: ActionPlacementTypes.VISIBLE
    },
    {
      type: "Action",
      name: "view",
      detail: true,
      i18n: "action.view",
      icon: "eye",
      variant: "outline",
      placement: ActionPlacementTypes.VISIBLE
    }
  ]
};
