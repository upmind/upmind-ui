// -----------------------------------------------------------------------------
/**
 * @module scenarios/useOrder/order.summary
 * @description How one order's fields DRAW on the record surface — its Details
 * block, its line items and its totals. Scopes read the raw order record the
 * manager publishes as `data` (`IOrder`, the raw `IInvoice`), its mapped detail
 * projection folded in as `detail` and its mapped items as `products`
 * (`orders.mappers.ts`). A field the order does not carry is not drawn.
 */

import { RuleEffect } from "@jsonforms/core";
import {
  TableCellListLayoutTypes,
  TableColumnWidthTypes
} from "../runtime/scenario.types";
import type { TableCell } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

/** What the order IS — its status, category and dates; the number is the record's title. */
export const orderSummary: TableCell[] = [
  {
    type: "TableCellStatus",
    scope: "#/properties/status",
    i18n: "text.status"
  },
  {
    type: "TableCellText",
    scope: "#/properties/category/properties/name",
    i18n: "invoices.table.category"
  },
  {
    type: "TableCellDate",
    scope: "#/properties/created_at",
    i18n: "text.purchase_date"
  },
  {
    type: "TableCellDate",
    scope: "#/properties/due_date",
    i18n: "invoices.table.date_due"
  },
  {
    type: "TableCellDate",
    scope: "#/properties/paid_datetime",
    i18n: "invoices.detail.date_paid"
  },
  {
    type: "TableCellDate",
    scope: "#/properties/next_charge_date",
    i18n: "invoices.detail.next_charge_date"
  }
];

/** What the order totals to — the raw record's formatted amounts, as the order table's foot draws them. */
export const orderTotals: TableCell[] = [
  {
    type: "TableCellText",
    scope: "#/properties/net_amount_formatted",
    i18n: "invoices.detail.subtotal"
  },
  {
    type: "TableCellText",
    scope: "#/properties/total_discount_amount_formatted",
    i18n: "invoices.detail.discount",
    rule: {
      effect: RuleEffect.SHOW,
      condition: {
        scope: "#/properties/total_discount_amount",
        schema: { type: "number", exclusiveMinimum: 0 }
      }
    }
  },
  {
    type: "TableCellText",
    scope: "#/properties/tax_amount_formatted",
    i18n: "text.taxes",
    rule: {
      effect: RuleEffect.SHOW,
      condition: {
        scope: "#/properties/tax_amount",
        schema: { type: "number", exclusiveMinimum: 0 }
      }
    }
  },
  {
    type: "TableCellText",
    scope: "#/properties/total_amount_formatted",
    i18n: "text.total"
  },
  {
    type: "TableCellText",
    scope: "#/properties/paid_amount_formatted",
    i18n: "invoices.detail.paid_amount",
    rule: {
      effect: RuleEffect.SHOW,
      condition: {
        scope: "#/properties/paid_amount",
        schema: { type: "number", exclusiveMinimum: 0 }
      }
    }
  },
  {
    type: "TableCellText",
    scope: "#/properties/unpaid_amount_formatted",
    i18n: "invoices.detail.unpaid_amount",
    rule: {
      effect: RuleEffect.SHOW,
      condition: {
        scope: "#/properties/unpaid_amount",
        schema: { type: "number", exclusiveMinimum: 0 }
      }
    }
  },
  {
    type: "TableCellText",
    scope: "#/properties/balance_formatted",
    i18n: "invoices.detail.balance"
  }
];

/**
 * One line item — a mapped `OrderItem` — as the order table's row draws it: how
 * it is billed, its quantity and total, and its sub-items where it has any.
 */
export const orderLineItemSummary: TableCell[] = [
  // The product's own name is the line's title; the service identifier rides it,
  // as the mapper joins them (`orders.mappers.ts`).
  {
    type: "TableCellText",
    scope: "#/properties/billingCycle/properties/name",
    i18n: "labs.record_billing"
  },
  {
    type: "TableCellText",
    scope: "#/properties/quantity",
    i18n: "labs.record_quantity",
    rule: {
      effect: RuleEffect.SHOW,
      condition: {
        scope: "#/properties/quantity",
        schema: { type: "number", exclusiveMinimum: 1 }
      }
    }
  },
  {
    type: "TableCellText",
    scope: "#/properties/total",
    i18n: "text.total"
  },
  {
    type: "TableCellList",
    scope: "#/properties/quantifiableItems",
    i18n: "invoice.product_information",
    rule: {
      effect: RuleEffect.SHOW,
      condition: {
        scope: "#/properties/quantifiableItems",
        schema: { type: "array", minItems: 1 }
      }
    },
    options: {
      width: TableColumnWidthTypes.FULL,
      layout: TableCellListLayoutTypes.ROWS,
      elements: [
        {
          type: "TableCellText",
          scope: "#/properties/name",
          i18n: "text.item"
        },
        {
          type: "TableCellText",
          scope: "#/properties/price",
          i18n: "text.total"
        }
      ]
    }
  },
  {
    type: "TableCellList",
    scope: "#/properties/nonQuantifiableItems",
    i18n: "labs.record_options",
    rule: {
      effect: RuleEffect.SHOW,
      condition: {
        scope: "#/properties/nonQuantifiableItems",
        schema: { type: "array", minItems: 1 }
      }
    },
    options: {
      width: TableColumnWidthTypes.FULL,
      layout: TableCellListLayoutTypes.ROWS,
      elements: [
        {
          type: "TableCellText",
          scope: "#/properties/name",
          i18n: "text.item"
        },
        {
          type: "TableCellText",
          scope: "#/properties/total",
          i18n: "text.total"
        }
      ]
    }
  }
];
