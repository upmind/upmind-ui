// -----------------------------------------------------------------------------
/**
 * @module scenarios/useInvoices/invoices.presentation
 * @description How an invoice row draws: the table, the card, the read-only
 * detail overlay, the action controls and the collection notices. Every scope
 * is a field of the mapped `Invoice` record (`invoices.types.ts`).
 */

import { ActionPlacementTypes, CardSlotTypes } from "../runtime/scenario.types";
import type {
  ActionsUischema,
  CardUischema,
  DetailUischema,
  MetaNoticeElement,
  TableBadge,
  TableUischema
} from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

const ATTRIBUTION_BADGES: TableBadge[] = [
  { flag: "isOwn", i18n: "invoices.badge.own", color: "neutral" },
  {
    flag: "isChildOfClient",
    i18n: "invoices.badge.child_of_client",
    color: "info"
  },
  { flag: "isDelegated", i18n: "invoices.badge.delegated", color: "warning" },
  {
    flag: "isSettleable",
    i18n: "invoices.badge.settleable",
    color: "success"
  }
];

export const tableUischema: TableUischema = {
  type: "TableLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/number",
      i18n: "invoices.table.number"
    },
    {
      type: "TableCellText",
      scope: "#/properties/status",
      i18n: "invoices.table.status"
    },
    {
      type: "TableCellText",
      scope: "#/properties/category/properties/label",
      i18n: "invoices.table.category"
    },
    {
      type: "TableCellText",
      scope: "#/properties/client/properties/display",
      i18n: "invoices.table.client"
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/attribution",
      i18n: "invoices.table.attribution",
      options: { badges: ATTRIBUTION_BADGES }
    },
    {
      type: "TableCellText",
      scope: "#/properties/summary/properties/total",
      i18n: "invoices.table.total"
    },
    {
      type: "TableCellText",
      scope: "#/properties/summary/properties/unpaidAmountFormatted",
      i18n: "invoices.table.unpaid"
    },
    {
      type: "TableCellDate",
      scope: "#/properties/dateCreated",
      i18n: "invoices.table.date_created"
    },
    {
      type: "TableCellDate",
      scope: "#/properties/dateDue",
      i18n: "invoices.table.date_due"
    },
    {
      type: "TableCellIcon",
      scope: "#/properties/locked",
      i18n: "invoices.table.locked",
      options: { icon: "lock-01" }
    }
  ]
};

export const cardUischema: CardUischema = {
  type: "CardLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/number",
      i18n: "invoices.table.number",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellBadges",
      scope: "#/properties/attribution",
      i18n: "invoices.table.attribution",
      options: { badges: ATTRIBUTION_BADGES, slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/status",
      i18n: "invoices.table.status",
      options: { slot: CardSlotTypes.TITLE }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/dateDue",
      i18n: "invoices.table.date_due",
      options: { slot: CardSlotTypes.SUBTITLE }
    },
    {
      type: "TableCellText",
      scope: "#/properties/summary/properties/total",
      i18n: "invoices.table.total",
      options: { slot: CardSlotTypes.BODY }
    },
    {
      type: "TableCellText",
      scope: "#/properties/summary/properties/unpaidAmountFormatted",
      i18n: "invoices.table.unpaid",
      options: { slot: CardSlotTypes.BODY }
    },
    {
      type: "TableCellText",
      scope: "#/properties/category/properties/label",
      i18n: "invoices.table.category",
      options: { slot: CardSlotTypes.BODY }
    }
  ]
};

/**
 * Composite fields (`address`, `currency`, `products`, `payments`, `bundle`)
 * are scoped to a scalar leaf or a mapper summary string: `TableCellText`
 * stringifies an object to `[object Object]`.
 */
export const detailUischema: DetailUischema = {
  type: "DetailLayout",
  elements: [
    {
      type: "TableCellText",
      scope: "#/properties/summary/properties/unpaidAmountFormatted",
      i18n: "invoices.detail.unpaid_amount"
    },
    {
      type: "TableCellText",
      scope: "#/properties/currencyPayment/properties/code",
      i18n: "invoices.detail.currency_payment"
    },
    {
      type: "TableCellText",
      scope: "#/properties/address/properties/description",
      i18n: "invoices.detail.address"
    },
    {
      type: "TableCellText",
      scope: "#/properties/currency/properties/code",
      i18n: "invoices.detail.currency"
    },
    {
      type: "TableCellText",
      scope: "#/properties/productsSummary",
      i18n: "invoices.detail.products"
    },
    {
      type: "TableCellText",
      scope: "#/properties/paymentsSummary",
      i18n: "invoices.detail.payments"
    },
    {
      type: "TableCellText",
      scope: "#/properties/paymentMethod/properties/label",
      i18n: "invoices.detail.payment_method"
    },
    {
      type: "TableCellText",
      scope: "#/properties/consolidation/properties/consolidationInvoiceId",
      i18n: "invoices.detail.consolidation_invoice"
    },
    {
      type: "TableCellText",
      scope: "#/properties/consolidation/properties/creditInvoiceId",
      i18n: "invoices.detail.credit_invoice"
    },
    {
      type: "TableCellText",
      scope: "#/properties/consolidation/properties/amountToCreditFormatted",
      i18n: "invoices.detail.amount_to_credit"
    },
    {
      type: "TableCellText",
      scope: "#/properties/bundle/properties/groupsSummary",
      i18n: "invoices.detail.bundle_groups"
    },
    {
      type: "TableCellIcon",
      scope: "#/properties/bundle/properties/isLarge",
      i18n: "invoices.detail.bundle_is_large",
      options: { icon: "box" }
    },
    {
      type: "TableCellDate",
      scope: "#/properties/nextChargeDate",
      i18n: "invoices.detail.next_charge_date"
    },
    {
      type: "TableCellDate",
      scope: "#/properties/datePaid",
      i18n: "invoices.detail.date_paid"
    },
    {
      type: "TableCellText",
      scope: "#/properties/summary/properties/subtotal",
      i18n: "invoices.detail.subtotal"
    },
    {
      type: "TableCellText",
      scope: "#/properties/summary/properties/discount",
      i18n: "invoices.detail.discount"
    },
    {
      type: "TableCellText",
      scope: "#/properties/summary/properties/paidAmountFormatted",
      i18n: "invoices.detail.paid_amount"
    },
    {
      type: "TableCellText",
      scope: "#/properties/summary/properties/balanceFormatted",
      i18n: "invoices.detail.balance"
    }
  ]
};

/**
 * Each `name` is a member of `useInvoices().useActions()`; `view` opens the
 * detail overlay. `assignPaymentMethod` and `downloadPdf` are not drawn: the
 * row press passes one argument to a list action, and `downloadPdf` lives on
 * `useInvoice()`, which no list surface binds.
 */
export const actionsUischema: ActionsUischema = {
  type: "ActionsLayout",
  elements: [
    // {
    //   type: "Action",
    //   name: "refresh",
    //   i18n: "action.refresh",
    //   icon: "refresh-cw-01",
    //   variant: "outline",
    //   placement: ActionPlacementTypes.HEADER,
    //   feedback: {
    //     success: "confirm.invoices_refreshed",
    //     failure: "error.invoices_refresh_failed"
    //   }
    // },
    // {
    //   type: "Action",
    //   name: "filterConsolidatable",
    //   i18n: "action.filter_consolidatable",
    //   icon: "box",
    //   variant: "outline",
    //   placement: ActionPlacementTypes.HEADER
    // },
    // {
    //   type: "Action",
    //   name: "filterCreditNotes",
    //   i18n: "action.filter_credit_notes",
    //   icon: "file-attachment-01",
    //   variant: "outline",
    //   placement: ActionPlacementTypes.HEADER
    // },
    // {
    //   type: "Action",
    //   name: "refreshAfterPayment",
    //   i18n: "action.refresh_after_payment",
    //   icon: "refresh-cw-01",
    //   variant: "outline",
    //   placement: ActionPlacementTypes.OVERFLOW,
    //   feedback: {
    //     success: "confirm.invoices_payment_refreshed",
    //     failure: "error.invoices_payment_refresh_failed"
    //   }
    // },
    // {
    //   type: "Action",
    //   name: "invalidate",
    //   i18n: "action.invalidate",
    //   icon: "alert-triangle",
    //   variant: "outline",
    //   placement: ActionPlacementTypes.OVERFLOW
    // },
    {
      type: "Action",
      name: "open",
      navigate: "/useInvoice/:id",
      i18n: "action.go_to_invoice",
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

/** Members of `useInvoices().useMeta()`; the read flips each request gate. */
export const noticesUischema: MetaNoticeElement[] = [
  {
    scope: "hasUnpaid",
    i18n: "invoices.notice.has_unpaid"
  },
  {
    scope: "consolidatableCount",
    i18n: "invoices.notice.consolidatable_count"
  }
];
