// -----------------------------------------------------------------------------
/**
 * @module scenarios/useInvoice/invoice.summary
 * @description ONE invoice summary, shared by the invoice record (its Details
 * section) and the invoice collection (its attribution badges), so the two can
 * never draw an invoice differently. Scopes read the mapped `Invoice`
 * (`invoices.mappers.ts`), which keeps no `raw`. A line item draws the fields
 * it shares with a contract product exactly as the contract-product summary
 * does (`contract-product.summary.ts`).
 */

import { RuleEffect } from "@jsonforms/core";
import {
  TableCellListLayoutTypes,
  TableColumnWidthTypes
} from "../runtime/scenario.types";
import { contractProductCatalogueCell } from "../useContractProduct/contract-product.summary";
import type { TableBadge, TableCell } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** Who the invoice was raised for — `Invoice.attribution`, one flag each. */
export const invoiceAttributionBadges: TableBadge[] = [
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

/** What the invoice IS — its status, category and dates; the number is the record's title. */
export const invoiceSummary: TableCell[] = [
  {
    type: "TableCellStatus",
    scope: "#/properties/statusName",
    i18n: "text.status"
  },
  {
    type: "TableCellText",
    scope: "#/properties/category/properties/label",
    i18n: "invoices.table.category",
    options: { i18nValue: "invoices.filter_option.category" }
  },
  {
    type: "TableCellDate",
    scope: "#/properties/dateCreated",
    i18n: "text.purchase_date"
  },
  {
    type: "TableCellDate",
    scope: "#/properties/dateDue",
    i18n: "invoices.table.date_due"
  },
  {
    type: "TableCellDate",
    scope: "#/properties/datePaid",
    i18n: "invoices.detail.date_paid"
  },
  {
    type: "TableCellDate",
    scope: "#/properties/nextChargeDate",
    i18n: "invoices.detail.next_charge_date"
  }
];

/** What the invoice totals to — `Invoice.summary`, as the order table's foot draws it. */
export const invoiceTotals: TableCell[] = [
  {
    type: "TableCellText",
    scope: "#/properties/summary/properties/subtotal",
    i18n: "invoices.detail.subtotal"
  },
  {
    type: "TableCellText",
    scope: "#/properties/summary/properties/discount",
    i18n: "invoices.detail.discount",
    rule: {
      effect: RuleEffect.SHOW,
      condition: {
        scope: "#/properties/summary/properties/discountAmount",
        schema: { type: "number", exclusiveMinimum: 0 }
      }
    }
  },
  {
    type: "TableCellList",
    scope: "#/properties/summary/properties/taxes",
    i18n: "text.taxes",
    options: {
      layout: TableCellListLayoutTypes.ROWS,
      elements: [
        {
          type: "TableCellText",
          scope: "#/properties/title",
          i18n: "text.taxes"
        },
        {
          type: "TableCellText",
          scope: "#/properties/amount",
          i18n: "text.total"
        }
      ]
    }
  },
  {
    type: "TableCellText",
    scope: "#/properties/summary/properties/total",
    i18n: "text.total"
  },
  {
    type: "TableCellText",
    scope: "#/properties/summary/properties/paidAmountFormatted",
    i18n: "invoices.detail.paid_amount",
    rule: {
      effect: RuleEffect.SHOW,
      condition: {
        scope: "#/properties/summary/properties/paidAmount",
        schema: { type: "number", exclusiveMinimum: 0 }
      }
    }
  },
  {
    type: "TableCellText",
    scope: "#/properties/summary/properties/unpaidAmountFormatted",
    i18n: "invoices.detail.unpaid_amount",
    rule: {
      effect: RuleEffect.SHOW,
      condition: {
        scope: "#/properties/summary/properties/unpaidAmount",
        schema: { type: "number", exclusiveMinimum: 0 }
      }
    }
  },
  {
    type: "TableCellText",
    scope: "#/properties/summary/properties/balanceFormatted",
    i18n: "invoices.detail.balance"
  }
];

/**
 * One line item — a mapped `BasketProduct` — as the order table's row draws
 * it, its product fields as the contract-product summary draws them.
 */
export const invoiceLineItemSummary: TableCell[] = [
  // The service identifier is not a field: the line's title carries it, as
  // legacy's line name does (`invoiceItems.vue:72`).
  contractProductCatalogueCell,
  {
    type: "TableCellText",
    scope: "#/properties/product/properties/category/properties/name",
    i18n: "text.category"
  },
  {
    type: "TableCellText",
    scope: "#/properties/productDetails/properties/quantity",
    i18n: "labs.record_quantity",
    rule: {
      effect: RuleEffect.SHOW,
      condition: {
        scope: "#/properties/productDetails/properties/quantity",
        schema: { type: "number", exclusiveMinimum: 1 }
      }
    }
  },
  {
    type: "TableCellText",
    scope: "#/properties/price/properties/currentPrice",
    i18n: "text.total"
  },
  {
    type: "TableCellText",
    scope: "#/properties/price/properties/savingPrice",
    i18n: "text.discount",
    rule: {
      effect: RuleEffect.SHOW,
      condition: {
        scope: "#/properties/meta/properties/discounted",
        schema: { const: true }
      }
    }
  },
  {
    type: "TableCellList",
    scope: "#/properties/details",
    i18n: "invoice.product_information",
    // The first detail is the line's own term and price, so a breakdown with
    // nothing else in it only repeats the line.
    rule: {
      effect: RuleEffect.SHOW,
      condition: {
        scope: "#/properties/details",
        schema: { type: "array", minItems: 2 }
      }
    },
    options: {
      width: TableColumnWidthTypes.FULL,
      layout: TableCellListLayoutTypes.ROWS,
      elements: [
        {
          type: "TableCellText",
          scope: "#/properties/title",
          i18n: "text.item"
        },
        {
          type: "TableCellText",
          scope: "#/properties/price/properties/currentPrice",
          i18n: "text.total"
        }
      ]
    }
  }
];

/**
 * One payment attempt on the invoice — `Invoice.payments`, headed by its
 * method as legacy's payment item is (`invoicePaymentItem.vue`).
 */
export const invoicePaymentSummary: TableCell[] = [
  {
    type: "TableCellText",
    scope: "#/properties/amountFormatted",
    i18n: "labs.record_amount"
  },

  {
    type: "TableCellDate",
    scope: "#/properties/createdAt",
    i18n: "invoices.table.date_created"
  },
  {
    type: "TableCellBadges",
    scope: "#/properties/meta",
    i18n: "text.status",
    options: {
      badges: [
        { flag: "isSuccessful", i18n: "text.confirmed", color: "success" },
        { flag: "isPending", i18n: "text.pending", color: "warning" }
      ]
    }
  }
];
