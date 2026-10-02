// -----------------------------------------------------------------------------
/**
 * @module scenarios/useContractProduct/contract-product.summary
 * @description ONE product summary, shared by the contract-product record
 * (its Details section) and the contract record (one section per product), so
 * the two can never draw a product differently. Its scopes read a mapped
 * `ContractProduct`, falling back to its `raw` where the mapper keeps a value
 * only there.
 */

import { RuleEffect } from "@jsonforms/core";
import type { TableCell } from "../runtime/scenario.types";

// -----------------------------------------------------------------------------

const RAW = "#/properties/raw/properties";

/**
 * The catalogue product a product was bought as — read off the same
 * `product.name` a mapped `ContractProduct` and an invoice line both carry, so
 * the invoice record's line items draw it with this very cell.
 */
export const contractProductCatalogueCell: TableCell = {
  type: "TableCellText",
  scope: "#/properties/product/properties/name",
  i18n: "labs.record_catalogue_product"
};

/**
 * What the product IS — its status, legacy's row heading and its order line.
 * The contract-product record's Details section and each product section of
 * the contract record, read off the same mapped product. The service
 * identifier is not a field: the mapped `title` carries it
 * (`contract-product.mappers.ts:184-190`).
 */
export const contractProductSummary: TableCell[] = [
  // cProdDetailsTable.vue:4-27 — the one status.
  {
    type: "TableCellStatus",
    scope: "#/properties/status",
    i18n: "text.status"
  },
  // cProdRowItem.vue:63-71 — the catalogue product under its category.
  contractProductCatalogueCell,
  {
    type: "TableCellText",
    scope: `${RAW}/product/properties/category/properties/name`,
    i18n: "text.category"
  },
  // cProdBreakdown.vue:47-48.
  {
    type: "TableCellText",
    scope: `${RAW}/quantity`,
    i18n: "labs.record_quantity",
    rule: {
      effect: RuleEffect.SHOW,
      condition: {
        scope: `${RAW}/quantity`,
        schema: { type: "number", exclusiveMinimum: 1 }
      }
    }
  },
  // cProdDetailsTable.vue:121-131.
  {
    type: "TableCellDate",
    scope: "#/properties/dateCreated",
    i18n: "text.purchase_date"
  },
  // cProdDetailsTable.vue:155-170.
  {
    type: "TableCellText",
    scope: `${RAW}/main_invoice_number`,
    i18n: "labs.record_order"
  },
  // cProdRowItem.vue:66-67.
  {
    type: "TableCellText",
    scope: "#/properties/brand/properties/name",
    i18n: "labs.record_brand"
  }
];
