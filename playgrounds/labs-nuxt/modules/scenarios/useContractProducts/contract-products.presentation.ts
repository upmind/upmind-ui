// -----------------------------------------------------------------------------
/**
 * @module scenarios/useContractProducts/contract-products.presentation
 * @description How a client's own contract products DRAW — the collection as
 * a table, the same row as a card, and the row-level/collection-level
 * actions. Grounded field by field on the live row
 * `useContractProducts().useContext().data` publishes (`ContractProduct` in
 * `contract-product.types.ts`), so nothing here describes a shape the
 * composable does not produce.
 *
 * D6 exclusions from the table's DEFAULT visible set, echoed and never
 * silently re-added: `id`, `contractId` (system ids — `id` stays reachable
 * through the binding's default `id` identifier); `isSubscription` (a
 * duplicate of `billingCycleMonths > 0`); `product.name` (a duplicate of
 * `name`); `scheduledActions` (absent on a list read); `raw` as a whole
 * (two of its members are read individually below); every other detail-only
 * fact (`contractStatus`, `stagedImport`, `contractRequest`, `renew`,
 * `calculatedCancelDate`, `provisionSetupFieldsConfirmed`, `inTrial`,
 * `trialEndAction`, `importId`, `moved`, `canCancel`,
 * `autoCreateRenewInvoice`, `unpaidRecurringInvoices`,
 * `hasScheduledFutureCancellation`, `clientInvoiceConsolidationEnabled`,
 * `brand`, `tags`, `futureCancellationRequest`, `movedToContractProduct`,
 * `delegatingClients`).
 *
 * The detail overlay fetches: `contract-products.scenario.ts` declares
 * `useDetail: useContractProduct`, so `view` boots the manager
 * `.withId(<row.id>)`. The manager publishes its record as `contractProduct`,
 * not `data` (`useContractProduct.context.ts`), so the detail element list
 * below reads `#/properties/contractProduct/...` under the declared
 * `siblings: ["contractProduct"]` — the same fold `DetailDialog.vue` applies
 * for any single-read composable whose context is not shaped `data`.
 *
 * NO EDITOR. The collection has no generic write (`useContractProducts`
 * carries no `useMutate` — every write is the per-product manager's own,
 * `useContractProduct().useActions()`), so no `handoff` is declared here and
 * the runtime never binds a row action to one.
 *
 * ORDERING is not here at all: the collection is ordered by the query
 * schema's own `sort` enum, which the control reads directly
 * (`useContractProducts().useContext().schemas.query.sortUischema`).
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
      scope: "#/properties/name",
      i18n: "text.product_name",
      options: { width: TableColumnWidthTypes.THIRD }
    },
    {
      type: "TableCellText",
      scope: "#/properties/status/properties/code",
      i18n: "text.status"
    },
    {
      type: "TableCellDate",
      scope: "#/properties/nextDueDate",
      i18n: "text.next_due_date"
    },
    {
      type: "TableCellText",
      scope: "#/properties/billingCycleMonths",
      i18n: "text.billing_cycle"
    },
    {
      type: "TableCellDate",
      scope: "#/properties/raw/properties/created_at",
      i18n: "text.purchase_date"
    },
    {
      type: "TableCellText",
      scope: "#/properties/raw/properties/total_amount",
      i18n: "text.price"
    },
    {
      type: "TableCellIcon",
      scope: "#/properties/isDelegatedObject",
      i18n: "text.delegated_label",
      options: { icon: "users-01" }
    }
  ]
};

/**
 * The SAME record, drawn as a card — a second declaration, never a second
 * component.
 */
export const cardUischema: CardUischema = {
  type: "CardLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/name",
      i18n: "text.product_name",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/status/properties/code",
      i18n: "text.status",
      options: { slot: CardSlotTypes.SUBTITLE }
    },
    {
      type: "TableCellIcon",
      scope: "#/properties/isDelegatedObject",
      i18n: "text.delegated_label",
      options: { icon: "users-01", slot: CardSlotTypes.SUBTITLE }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/nextDueDate",
      i18n: "text.next_due_date",
      options: { slot: CardSlotTypes.BODY }
    },
    {
      type: "TableCellText",
      scope: "#/properties/raw/properties/total_amount",
      i18n: "text.price",
      options: { slot: CardSlotTypes.BODY }
    }
  ]
};

/**
 * ONE product drawn READ-ONLY in the detail overlay — the manager's own fetch
 * (`useDetail: useContractProduct`), folded in under `contractProduct`
 * (`siblings`, D3/D52) rather than `data`, since the manager publishes its
 * record under that name.
 */
export const detailUischema: DetailUischema = {
  type: "DetailLayout",
  siblings: ["contractProduct"],
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/contractProduct/properties/name",
      i18n: "text.product_name"
    },
    {
      type: "TableCellText",
      scope: "#/properties/contractProduct/properties/status/properties/code",
      i18n: "text.status"
    },
    {
      type: "TableCellDate",
      scope: "#/properties/contractProduct/properties/nextDueDate",
      i18n: "text.next_due_date"
    },
    {
      type: "TableCellText",
      scope: "#/properties/contractProduct/properties/billingCycleMonths",
      i18n: "text.billing_cycle"
    },
    {
      type: "TableCellDate",
      scope: "#/properties/contractProduct/properties/calculatedCancelDate",
      i18n: "text.calculated_cancel_date"
    },
    {
      type: "TableCellIcon",
      scope: "#/properties/contractProduct/properties/isDelegatedObject",
      i18n: "text.delegated_label",
      options: { icon: "users-01" }
    }
  ]
};

/**
 * The controls this scenario can actually drive: opening the row's own manager
 * page (`open`, a surface-owned `navigate`), opening it READ-ONLY in the
 * detail overlay (`view`), and the collection's own reads — `refresh`,
 * `loadGroupedCounts` (G1: publishes onto `useContext().groupedCounts`, which
 * the shared `ContextPanel` already draws) and `loadPurchasedCategories`
 * (R10). Every per-product write (`stopRenewing`, `requestCancellation`, the
 * cancellation/consolidation forms, …) lives on the MANAGER's own action map,
 * which the runtime never binds a row action to, so none is declared here —
 * that surface is `useContractProduct`'s own self-drawn page.
 */
export const actionsUischema: ActionsUischema = {
  type: "ActionsLayout",
  elements: [
    {
      type: "Action",
      name: "open",
      navigate: "/useContractProduct/:id",
      i18n: "action.open_contract_product",
      icon: "link-external-01",
      variant: "outline",
      placement: ActionPlacementTypes.VISIBLE
    },
    {
      type: "Action",
      name: "view",
      detail: true,
      i18n: "action.view_contract_product",
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
        success: "confirm.contract_products_refreshed",
        failure: "error.contract_products_refresh_failed"
      }
    },
    {
      type: "Action",
      name: "loadGroupedCounts",
      i18n: "action.load_grouped_counts",
      icon: "layers-three-01",
      variant: "outline",
      placement: ActionPlacementTypes.HEADER,
      feedback: {
        success: "confirm.contract_products_grouped_counts_loaded",
        failure: "error.contract_products_grouped_counts_failed"
      }
    },
    {
      type: "Action",
      name: "loadPurchasedCategories",
      i18n: "action.load_purchased_categories",
      icon: "tag-02",
      variant: "outline",
      placement: ActionPlacementTypes.HEADER,
      feedback: {
        success: "confirm.contract_products_categories_loaded",
        failure: "error.contract_products_categories_failed"
      }
    }
  ]
};
