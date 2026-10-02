// -----------------------------------------------------------------------------
/**
 * @module scenarios/useOrder/order.presentation
 * @description How one order DRAWS as a record on the shared record surface:
 * its number, its status, its payment-state badges, where it stands, its
 * details, one section per line item (each linking to the product and contract
 * it bills) and its totals. Every label reuses the invoice record's wording
 * where the meaning is the same; a field the order does not carry is not drawn.
 *
 * The record is the raw order the manager publishes as `data` (`IOrder`), its
 * mapped detail projection folded in as the `detail` sibling and its mapped
 * items as the `products` sibling — so a scope reads the raw record by its wire
 * name and an item by its mapped name, from one model.
 *
 * Pay navigates to the `?init=pay` overlay (`overlay-payment`) this page hosts,
 * the same deep link the invoice record opens; paying never happens on the
 * record. It is the header's one primary action, gated on the order's own
 * `canPay`. The status hero and the payment alerts say the first of their
 * declared notices whose gates open, read from the order's status inputs.
 */

import {
  RecordActionPlacementTypes,
  TableColumnWidthTypes
} from "../runtime/scenario.types";
import {
  orderLineItemSummary,
  orderSummary,
  orderTotals
} from "./order.summary";
import type {
  RecordNoticeDeclaration,
  RecordUischema
} from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

const UNPAID_AMOUNT = "#/properties/unpaid_amount_formatted";
const PAID_AMOUNT = "#/properties/paid_amount_formatted";
const DATE_DUE = "#/properties/due_date";
const DATE_PAID = "#/properties/paid_datetime";

/** Where the order stands — its hero line, first match wins. */
const lead: RecordNoticeDeclaration[] = [
  {
    name: "paid",
    gate: "isPaid",
    i18n: {
      title: "invoice.order_complete",
      text: "invoice.order_complete_msg"
    }
  },
  {
    name: "partial",
    gate: "isPartiallyPaid",
    i18n: {
      title: "invoice.order_complete",
      text: "invoice.order_partial_payment_msg"
    },
    values: { paid_amount: PAID_AMOUNT }
  },
  {
    name: "placed",
    i18n: { title: "invoice.order_placed", text: "invoice.order_placed_msg" }
  }
];

/** The order, drawn whole as one record. */
export const orderRecord: RecordUischema = {
  type: "RecordLayout",
  record: "data",
  siblings: ["detail", "products"],
  header: {
    title: "#/properties/number",
    status: "#/properties/status/properties/name",
    lead,
    badges: [
      { flag: "isPaid", i18n: "text.confirmed", color: "success" },
      { flag: "isDue", i18n: "invoice.payment_due", color: "warning" },
      {
        flag: "isPartiallyPaid",
        i18n: "invoice.payment_partial",
        color: "warning"
      },
      {
        flag: "isOverdue",
        i18n: "labs.orders_status_overdue",
        color: "danger"
      },
      { flag: "hasPendingPayment", i18n: "text.pending", color: "warning" },
      {
        flag: "isCancelled",
        i18n: "labs.orders_status_cancelled",
        color: "neutral"
      },
      {
        flag: "isDelegated",
        i18n: "invoices.badge.delegated",
        color: "warning"
      }
    ]
  },
  sections: [
    {
      kind: "alert",
      key: "outcome",
      alerts: [
        {
          name: "paid",
          gate: ["isPaid", DATE_PAID],
          i18n: { title: "invoice.payment_success_banner" },
          values: { date: DATE_PAID },
          variant: "success",
          icon: "check-circle"
        }
      ]
    },
    {
      kind: "alert",
      key: "payment",
      alerts: [
        {
          name: "due",
          gate: ["isDue", DATE_DUE],
          i18n: {
            title: "invoice.payment_due",
            text: "invoice.payment_due_msg"
          },
          values: { amount: UNPAID_AMOUNT, due_date: DATE_DUE },
          variant: "warning",
          icon: "clock-stopwatch"
        },
        {
          name: "required",
          gate: "isDue",
          i18n: {
            title: "invoice.payment_due",
            text: "invoice.payment_required_msg"
          },
          values: { amount: UNPAID_AMOUNT },
          variant: "warning",
          icon: "clock-stopwatch"
        }
      ]
    },
    {
      kind: "alert",
      key: "settlement",
      alerts: [
        {
          name: "pending",
          gate: "hasPendingPayment",
          i18n: {
            title: "invoice.order_pending",
            text: "invoice.order_pending_msg"
          },
          variant: "warning",
          icon: "clock"
        },
        {
          name: "outstanding",
          gate: "isPartiallyPaid",
          i18n: {
            title: "invoice.payment_partial",
            text: "invoice.payment_partial_msg"
          },
          values: { remaining_amount: UNPAID_AMOUNT },
          variant: "warning",
          icon: "alert-octagon"
        }
      ]
    },
    {
      kind: "fields",
      key: "details",
      i18n: "labs.record_details",
      icon: "receipt",
      elements: [
        ...orderSummary,
        {
          type: "TableCellText",
          scope: "#/properties/currency/properties/code",
          i18n: "invoices.detail.currency"
        },
        {
          type: "TableCellText",
          scope: "#/properties/client/properties/fullname",
          i18n: "invoices.table.client"
        },
        {
          type: "TableCellText",
          scope: "#/properties/address/properties/address_1",
          i18n: "invoices.detail.address",
          options: { width: TableColumnWidthTypes.HALF }
        },
        {
          type: "TableCellText",
          scope: "#/properties/detail/properties/cancellationReason",
          i18n: "labs.order_cancellation_reason"
        },
        {
          type: "TableCellText",
          scope: "#/properties/notes",
          i18n: "labs.order_notes"
        },
        {
          type: "TableCellText",
          scope: "#/properties/detail/properties/referrer/properties/fullname",
          i18n: "labs.order_referrer"
        }
      ]
    },
    {
      kind: "collection",
      key: "line-items",
      i18n: "invoice.your_order",
      scope: "#/properties/products",
      rowTitle: "#/properties/name",
      rowIcon: "shopping-bag-02",
      row: orderLineItemSummary,
      rowActions: [
        {
          name: "open-product",
          i18n: "labs.contract_product_open",
          icon: "arrow-right",
          placement: RecordActionPlacementTypes.ROW,
          gate: "#/properties/contractProductId",
          navigate: {
            route: "/useContractProduct/:id",
            idScope: "#/properties/contractProductId"
          }
        },
        {
          name: "open-contract",
          i18n: "labs.record_open_contract",
          icon: "arrow-right",
          placement: RecordActionPlacementTypes.ROW,
          gate: "#/properties/contractId",
          navigate: {
            route: "/useContract/:id",
            idScope: "#/properties/contractId"
          }
        }
      ]
    },
    {
      kind: "fields",
      key: "summary",
      i18n: "text.order_summary",
      icon: "shopping-bag-02",
      elements: orderTotals
    }
  ],
  actions: [
    {
      name: "pay",
      i18n: "action.pay_now",
      icon: "credit-card-01",
      placement: RecordActionPlacementTypes.HEADER,
      variant: "primary",
      gate: "canPay",
      navigate: { query: { init: "pay" } }
    },
    {
      name: "account",
      i18n: "action.go_to_my_account",
      icon: "arrow-right",
      gate: "isComplete",
      transfer: {
        redirect: "/billing/orders/:id/overview",
        idScope: "#/properties/id"
      }
    }
  ]
};
