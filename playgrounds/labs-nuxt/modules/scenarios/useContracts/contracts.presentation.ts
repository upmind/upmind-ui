// -----------------------------------------------------------------------------
/**
 * @module scenarios/useContracts/contracts.presentation
 * @description How a client's own contracts DRAW — the collection as a table,
 * the same row as a card, one row READ-ONLY in the detail overlay, and the
 * row-level/collection-level actions. Grounded field by field on the live row
 * `useContracts().useContext().data` publishes (`Contract` in
 * `contract.types.ts`): `title`, `status.code` badged through `meta`,
 * the cancellation request badged in the same status cell, `dateNextDue`,
 * `billingCycleLabel`, `datePurchased` and `totalAmountFormatted`. Dates draw
 * through `useDate` descriptors (`TableCellDate`); the billing cycle draws its
 * translated label, never the raw month count (GAP-02). No element
 * reads `raw.*` (R38 item 10) — every fact below is a mapped view-model member.
 *
 * D6 exclusions from the table's DEFAULT visible set, echoed and never
 * silently re-added: `id`, `paymentDetailsId` (system ids — `id` stays
 * reachable through the binding's default `id` identifier); `name` (`null` on
 * every recorded row — `title` carries it, G1); `status` the raw code (`meta`
 * badges it); `products` (the contract's products are `useContractProducts`'
 * own page); `raw` as a whole.
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
 * FILTER, SORT AND PAGER are not declared here at all (R38 supersedes the
 * withdrawn R32 pagination-only shape): the runtime draws them straight off
 * `useContracts().useContext().schemas.query` and `.pagination`, the same
 * fold every criteria-backed collection already gets.
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
  TableBadge,
  TableUischema
} from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

const STATUS_BADGES: TableBadge[] = [
  { flag: "isActive", i18n: "text.contract_status_active", color: "success" },
  {
    flag: "isAwaitingActivation",
    i18n: "text.contract_status_awaiting_activation",
    color: "info"
  },
  {
    flag: "isPending",
    i18n: "text.contract_status_pending",
    color: "warning"
  },
  {
    flag: "isSuspended",
    i18n: "text.contract_status_suspended",
    color: "warning"
  },
  { flag: "isCancelled", i18n: "text.contract_status_cancelled" },
  { flag: "isClosed", i18n: "text.contract_status_closed" },
  { flag: "isFraud", i18n: "text.contract_status_fraud" }
];

const CANCELLATION_REQUEST_BADGES: TableBadge[] = [
  {
    flag: "isCancellationRequest",
    i18n: "text.contract_request_cancellation_request",
    color: "warning"
  },
  {
    flag: "isEndOfBillingCycle",
    i18n: "text.contract_request_end_of_billing_cycle",
    color: "info"
  },
  {
    flag: "isEndOfBillingCycleUnacknowledged",
    i18n: "text.contract_request_end_of_billing_cycle_unacknowledged",
    color: "warning"
  },
  {
    flag: "isScheduledFutureCancellation",
    i18n: "text.contract_request_scheduled_future_cancellation",
    color: "info"
  },
  { flag: "isAccepted", i18n: "text.contract_request_accepted" }
];

/** One status cell badges the contract status and its cancellation request together. */
const ROW_STATUS_BADGES: TableBadge[] = [
  ...STATUS_BADGES,
  ...CANCELLATION_REQUEST_BADGES
];

export const tableUischema: TableUischema = {
  type: "TableLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/title",
      i18n: "text.contract_name",
      options: { width: TableColumnWidthTypes.QUARTER }
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: { badges: ROW_STATUS_BADGES }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/dateNextDue",
      i18n: "text.next_due_date"
    },
    {
      type: "TableCellDate",
      scope: "#/properties/datePurchased",
      i18n: "text.purchase_date"
    },
    {
      type: "TableCellText",
      scope: "#/properties/billingCycleLabel",
      i18n: "text.billing_cycle"
    },
    {
      type: "TableCellText",
      scope: "#/properties/totalAmountFormatted",
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
      scope: "#/properties/title",
      i18n: "text.contract_name",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/meta",
      i18n: "text.status",
      options: {
        badges: ROW_STATUS_BADGES,
        slot: CardSlotTypes.SUBTITLE
      }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/dateNextDue",
      i18n: "text.next_due_date",
      options: { slot: CardSlotTypes.BODY }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/datePurchased",
      i18n: "text.purchase_date",
      options: { slot: CardSlotTypes.BODY }
    },
    {
      type: "TableCellText",
      scope: "#/properties/totalAmountFormatted",
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
      scope: "#/properties/contract/properties/title",
      i18n: "text.contract_name"
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/contract/properties/meta",
      i18n: "text.status",
      options: { badges: ROW_STATUS_BADGES }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/contract/properties/dateNextDue",
      i18n: "text.next_due_date"
    },
    {
      type: "TableCellDate",
      scope: "#/properties/contract/properties/datePurchased",
      i18n: "text.purchase_date"
    },
    {
      type: "TableCellText",
      scope: "#/properties/contract/properties/billingCycleLabel",
      i18n: "text.billing_cycle"
    },
    {
      type: "TableCellText",
      scope: "#/properties/contract/properties/totalAmountFormatted",
      i18n: "text.price"
    }
  ]
};

/**
 * The controls this scenario can actually drive: opening the row's own manager
 * page (`open`, a surface-owned `navigate`), opening it READ-ONLY in the
 * detail overlay (`view`), and the collection's own `refresh`. Filtering,
 * sorting and paging are the runtime's own criteria surfaces, off the schemas
 * and pagination the collection publishes — never a declared control here.
 * The payment-method write lives on the MANAGER's action map, which the
 * runtime never binds a row action to — that surface is `useContract`'s own
 * self-drawn page.
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
