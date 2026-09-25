// -----------------------------------------------------------------------------
/**
 * @module scenarios/useContracts/contracts.presentation
 * @description How a client's own contracts DRAW — the collection as a table,
 * the same row as a card, one row READ-ONLY in the detail overlay, and the
 * row-level/collection-level actions. Grounded field by field on the live row
 * `useContracts().useContext().data` publishes (`Contract` in
 * `contract.types.ts`): the view model maps `id`, `status`, `paymentDetailsId`,
 * `cancellationRequest` and `products`, and keeps the wire record whole on
 * `raw`, so every display fact below is read off `raw` rather than restated.
 *
 * D6 exclusions from the table's DEFAULT visible set, echoed and never
 * silently re-added: `id`, `paymentDetailsId` (system ids — `id` stays
 * reachable through the binding's default `id` identifier); `products` (the
 * contract's products are `useContractProducts`' own page); `raw` as a whole
 * (its members are read individually below).
 *
 * The detail overlay fetches: `contracts.scenario.ts` declares
 * `useDetail: useContract`, so `view` boots the manager `.withId(<row.id>)`.
 * The manager publishes its record as `contract`, not `data`
 * (`useContract.context.ts`), so the detail element list below reads
 * `#/properties/contract/...` under the declared `siblings: ["contract"]`.
 *
 * NO EDITOR. The collection has no generic write — the ONE contract write,
 * the payment-method form, is the manager's own (`useContract().useActions()`),
 * so no `handoff` is declared here.
 *
 * PAGINATION ONLY (R32): the query schema declares no filter and no sort
 * column (`contract.schemas.ts`), so no ordering or filter control is drawn.
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
      scope: "#/properties/raw/properties/name",
      i18n: "text.contract_name",
      options: { width: TableColumnWidthTypes.THIRD }
    },
    {
      type: "TableCellText",
      scope: "#/properties/status/properties/code",
      i18n: "text.status"
    },
    {
      type: "TableCellDate",
      scope: "#/properties/raw/properties/next_due_date",
      i18n: "text.next_due_date"
    },
    {
      type: "TableCellText",
      scope: "#/properties/raw/properties/billing_cycle_months",
      i18n: "text.billing_cycle"
    },
    {
      type: "TableCellDate",
      scope: "#/properties/raw/properties/created_at",
      i18n: "text.purchase_date"
    },
    {
      type: "TableCellText",
      scope: "#/properties/raw/properties/total_recurrent_amount_formatted",
      i18n: "text.price"
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
      scope: "#/properties/raw/properties/name",
      i18n: "text.contract_name",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/status/properties/code",
      i18n: "text.status",
      options: { slot: CardSlotTypes.SUBTITLE }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/raw/properties/next_due_date",
      i18n: "text.next_due_date",
      options: { slot: CardSlotTypes.BODY }
    },
    {
      type: "TableCellText",
      scope: "#/properties/raw/properties/total_recurrent_amount_formatted",
      i18n: "text.price",
      options: { slot: CardSlotTypes.BODY }
    }
  ]
};

/**
 * ONE contract drawn READ-ONLY in the detail overlay — the manager's own fetch
 * (`useDetail: useContract`), folded in under `contract` (`siblings`) rather
 * than `data`, since the manager publishes its record under that name.
 */
export const detailUischema: DetailUischema = {
  type: "DetailLayout",
  siblings: ["contract"],
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/contract/properties/raw/properties/name",
      i18n: "text.contract_name"
    },
    {
      type: "TableCellText",
      scope: "#/properties/contract/properties/status/properties/code",
      i18n: "text.status"
    },
    {
      type: "TableCellText",
      scope:
        "#/properties/contract/properties/cancellationRequest/properties/status/properties/code",
      i18n: "text.cancellation_request_status"
    },
    {
      type: "TableCellDate",
      scope: "#/properties/contract/properties/raw/properties/next_due_date",
      i18n: "text.next_due_date"
    },
    {
      type: "TableCellText",
      scope:
        "#/properties/contract/properties/raw/properties/billing_cycle_months",
      i18n: "text.billing_cycle"
    },
    {
      type: "TableCellText",
      scope:
        "#/properties/contract/properties/raw/properties/total_recurrent_amount_formatted",
      i18n: "text.price"
    }
  ]
};

/**
 * The controls this scenario can actually drive: opening the row's own manager
 * page (`open`, a surface-owned `navigate`), opening it READ-ONLY in the
 * detail overlay (`view`), and the collection's own `refresh`. Paging is the
 * list surface's own, off `useContext().pagination`. The payment-method write
 * lives on the MANAGER's action map, which the runtime never binds a row
 * action to — that surface is `useContract`'s own self-drawn page.
 */
export const actionsUischema: ActionsUischema = {
  type: "ActionsLayout",
  elements: [
    {
      type: "Action",
      name: "open",
      navigate: "/useContract/:id",
      i18n: "action.open_contract",
      icon: "link-external-01",
      variant: "outline",
      placement: ActionPlacementTypes.VISIBLE
    },
    {
      type: "Action",
      name: "view",
      detail: true,
      i18n: "action.view_contract",
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
        success: "confirm.contracts_refreshed",
        failure: "error.contracts_refresh_failed"
      }
    }
  ]
};
