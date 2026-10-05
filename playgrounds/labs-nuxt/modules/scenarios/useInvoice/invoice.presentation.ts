// -----------------------------------------------------------------------------
/**
 * @module scenarios/useInvoice/invoice.presentation
 * @description How one invoice DRAWS as a record on the shared record surface:
 * its number, its status, its payment-state badges, its details, one section
 * per line item (each linking to the product and contract it bills), its
 * order items (the snapshot first, folded in as the `items` sibling) and its
 * order conditions, its payments and its totals. Every label is legacy's wording (`vue-app`
 * `invoiceDetails.vue`, `invoiceItems.vue`); a field legacy does not show on
 * the invoice is not drawn.
 *
 * Pay navigates to the `?init=pay` overlay (`overlay-payment`) this page hosts;
 * paying never happens on the record. It is the header's one primary action —
 * the order page's own call to action — declared twice because the order page
 * offers it on two mutually exclusive flags (`isPaymentDue`, nothing paid;
 * `isPartial`, some paid).
 *
 * What the order page said around the record has a declared home here too:
 * its hero line is the header's `lead`; its payment alerts, its outcome banner
 * and its guest-registration prompt are `alert` sections; its account button is
 * a `transfer` action. The PDF, payment-method and pay-currency writes are the
 * module's own actions, the two that take input through the shared dialog.
 */

import { ScopeActorTypes, useInvoices } from "@upmind-automation/headless";
import {
  RecordActionPlacementTypes,
  TableColumnWidthTypes
} from "../runtime/scenario.types";
import {
  invoiceItemSummary,
  invoiceLineItemSummary,
  invoicePaymentSummary,
  invoiceSummary,
  invoiceTotals
} from "./invoice.summary";
import type {
  RecordActionDeclaration,
  RecordNoticeDeclaration,
  RecordUischema
} from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

const PAY: Omit<RecordActionDeclaration, "name" | "gate"> = {
  i18n: "action.pay_now",
  icon: "credit-card-01",
  placement: RecordActionPlacementTypes.HEADER,
  variant: "primary",
  navigate: { query: { init: "pay" } }
};

const PAID_AMOUNT = "#/properties/summary/properties/paidAmountFormatted";
const UNPAID_AMOUNT = "#/properties/summary/properties/unpaidAmountFormatted";
const DATE_DUE = "#/properties/dateDue/properties/date";
const DATE_PAID = "#/properties/datePaid/properties/date";

/** `invoice.payment_success_banner` — a charged invoice that has taken money. */
const PAID: Omit<RecordNoticeDeclaration, "name" | "gate"> = {
  i18n: { title: "invoice.payment_success_banner" },
  values: { date: DATE_PAID },
  variant: "success",
  icon: "check-circle"
};

/** The order page's hero — where the order stands, first match wins. */
const lead: RecordNoticeDeclaration[] = [
  {
    name: "complete",
    gate: "isComplete",
    i18n: {
      title: "invoice.order_complete",
      text: "invoice.order_complete_msg"
    }
  },
  {
    name: "partial",
    gate: "isPartial",
    i18n: {
      title: "invoice.order_complete",
      text: "invoice.order_partial_payment_msg"
    },
    values: { paid_amount: PAID_AMOUNT }
  },
  {
    name: "free",
    gate: "isFree",
    i18n: { title: "invoice.order_placed", text: "invoice.order_free_msg" }
  },
  {
    name: "placed",
    i18n: { title: "invoice.order_placed", text: "invoice.order_placed_msg" }
  }
];

/** The invoice, drawn whole as one record. */
export const invoiceRecord: RecordUischema = {
  type: "RecordLayout",
  record: "model",
  siblings: ["items"],
  header: {
    title: "#/properties/number",
    status: "#/properties/statusName",
    lead,
    badges: [
      { flag: "isComplete", i18n: "text.confirmed", color: "success" },
      { flag: "isPaymentDue", i18n: "invoice.payment_due", color: "warning" },
      { flag: "isPartial", i18n: "invoice.payment_partial", color: "warning" },
      { flag: "isPending", i18n: "text.pending", color: "warning" },
      {
        flag: "hasError",
        i18n: "invoice.order_payment_failed",
        color: "danger"
      },
      { flag: "isLocked", i18n: "invoice.order_locked", color: "neutral" },
      { flag: "isFree", i18n: "invoice.order_free", color: "neutral" },
      {
        flag: "isOverdue",
        i18n: "invoices.filter_option.status.invoice_overdue",
        color: "danger"
      },
      {
        flag: "isCancelled",
        i18n: "invoices.filter_option.status.invoice_cancelled",
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
          name: "failed",
          gate: "hasError",
          i18n: { title: "invoice.payment_failed_banner" },
          variant: "danger",
          icon: "alert-octagon"
        },
        { ...PAID, name: "paid", gate: ["isComplete", "!isFree", DATE_PAID] },
        {
          ...PAID,
          name: "paid-part",
          gate: ["isPartial", "!isFree", DATE_PAID]
        }
      ]
    },
    {
      kind: "alert",
      key: "payment",
      alerts: [
        {
          name: "locked",
          gate: "isLocked",
          i18n: {
            title: "invoice.order_locked",
            text: "invoice.order_locked_msg"
          },
          variant: "neutral",
          icon: "lock-01"
        },
        {
          name: "failed",
          gate: "hasError",
          i18n: {
            title: "invoice.payment_retry",
            text: "invoice.payment_retry_msg"
          },
          variant: "danger",
          icon: "alert-octagon"
        },
        {
          name: "due",
          gate: ["isPaymentDue", DATE_DUE],
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
          gate: "isPaymentDue",
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
          gate: "isPending",
          i18n: {
            title: "invoice.order_pending",
            text: "invoice.order_pending_msg"
          },
          variant: "warning",
          icon: "clock",
          action: {
            name: "refresh-pending",
            i18n: "action.refresh",
            run: "refresh"
          }
        },
        {
          name: "outstanding",
          gate: "isPartial",
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
      kind: "alert",
      key: "guest-registration",
      alerts: [
        {
          name: "register",
          gate: ["isComplete", "isGuestClient"],
          i18n: {
            title: "auth.guest_register_title",
            text: "auth.guest_register_description"
          },
          variant: "neutral",
          icon: "user-plus-01",
          action: {
            name: "register",
            i18n: "action.register",
            navigate: { route: "/auth/register", unscoped: true }
          }
        }
      ]
    },
    {
      kind: "fields",
      key: "details",
      i18n: "labs.record_details",
      icon: "receipt",
      elements: [
        ...invoiceSummary,
        {
          type: "TableCellText",
          scope: "#/properties/currency/properties/code",
          i18n: "invoices.detail.currency"
        },
        {
          type: "TableCellText",
          scope: "#/properties/paymentMethod/properties/label",
          i18n: "invoices.detail.payment_method"
        },
        {
          type: "TableCellText",
          scope: "#/properties/client/properties/display",
          i18n: "invoices.table.client"
        },
        {
          type: "TableCellText",
          scope: "#/properties/address/properties/description",
          i18n: "invoices.detail.address",
          options: { width: TableColumnWidthTypes.HALF }
        },
        {
          type: "TableCellDate",
          scope: "#/properties/dateCancelled",
          i18n: "invoices.detail.date_cancelled"
        },
        {
          type: "TableCellText",
          scope: "#/properties/cancellationReason",
          i18n: "invoices.detail.cancellation_reason"
        },
        {
          type: "TableCellText",
          scope: "#/properties/notes",
          i18n: "invoices.detail.notes"
        },
        {
          type: "TableCellText",
          scope: "#/properties/referrer/properties/fullname",
          i18n: "invoices.detail.referrer"
        }
      ]
    },
    {
      kind: "collection",
      key: "order-items",
      i18n: "invoices.detail.order_items",
      scope: "#/properties/items",
      rowTitle: "#/properties/name",
      rowIcon: "shopping-bag-02",
      row: invoiceItemSummary
    },
    {
      kind: "collection",
      key: "line-items",
      i18n: "invoice.your_order",
      scope: "#/properties/products",
      rowTitle: [
        "#/properties/productDetails/properties/title",
        "#/properties/productDetails/properties/name"
      ],
      rowIcon: "shopping-bag-02",
      row: invoiceLineItemSummary,
      rowActions: [
        {
          name: "open-product",
          i18n: "labs.contract_product_open",
          icon: "arrow-right",
          placement: RecordActionPlacementTypes.ROW,
          gate: "#/properties/contractsProductId",
          navigate: {
            route: "/useContractProduct/:id",
            idScope: "#/properties/contractsProductId"
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
      kind: "collection",
      key: "payments",
      i18n: "invoices.detail.payments",
      scope: "#/properties/payments",
      rowTitle: ["#/properties/label", "#/properties/amountFormatted"],
      rowIcon: "credit-card-01",
      row: invoicePaymentSummary
    },
    {
      kind: "fields",
      key: "summary",
      i18n: "text.order_summary",
      icon: "shopping-bag-02",
      elements: invoiceTotals
    }
  ],
  actions: [
    { ...PAY, name: "pay", gate: "isPaymentDue" },
    { ...PAY, name: "pay-balance", gate: "isPartial" },
    {
      name: "retry",
      i18n: "invoice.payment_retry_action",
      icon: "refresh-cw-01",
      gate: "hasError",
      run: "retry"
    },
    {
      name: "download-pdf",
      i18n: "labs.invoice_download_pdf",
      icon: "arrow-down",
      run: "downloadPdf"
    },
    {
      name: "payment-method",
      i18n: "labs.invoice_payment_method_open",
      icon: "credit-card-01",
      gate: "canUpdatePaymentMethod",
      run: "openPaymentMethod",
      form: {
        context: "paymentMethod",
        set: "input",
        submit: "updatePaymentDetails",
        i18n: "labs.invoice_payment_method",
        submitI18n: "labs.invoice_payment_method_submit"
      }
    },
    {
      name: "currency",
      i18n: "labs.invoice_currency_open",
      icon: "switch-horizontal-01",
      gate: "hasPaymentCurrencyChoice",
      form: {
        context: "currency",
        args: ["#/properties/code"],
        submit: "setCurrency",
        i18n: "invoices.detail.switch_currency",
        submitI18n: "labs.invoice_currency_submit"
      }
    },
    {
      name: "account",
      i18n: "action.go_to_my_account",
      icon: "arrow-right",
      gate: "!isGuestClient",
      transfer: {
        redirect: "/billing/orders/:id/overview",
        idScope: "#/properties/id"
      }
    },
    {
      name: "refresh",
      i18n: "action.refresh",
      icon: "refresh-cw-01",
      placement: RecordActionPlacementTypes.UTILITY,
      run: "refresh"
    }
  ],
  picker: {
    use: useInvoices,
    actor: ScopeActorTypes.SELF,
    schema: "schemas.invoicePicker",
    field: "invoice",
    resolve: {
      filter: "number",
      i18n: {
        title: "labs.invoice_not_found",
        text: "labs.invoice_not_found_text"
      }
    },
    icon: "receipt",
    i18n: {
      title: "labs.invoice_needs_id",
      text: "labs.invoice_needs_id_text",
      input: "labs.invoice_id_label",
      open: "labs.invoice_open"
    }
  }
};
