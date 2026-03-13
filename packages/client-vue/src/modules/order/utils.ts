// --- internal
import { parseBillingCycle } from "@upmind-automation/headless";

// --- types
import type {
  ProductSummaryDetail,
  ProductSummaryDetailWithPrice
} from "@upmind-automation/headless";
import type { TableRow } from "./types";

// -----------------------------------------------------------------------------

export function buildPricingRow(
  entry: ProductSummaryDetailWithPrice
): TableRow {
  return {
    item: entry.title ?? entry.name,
    meta: { emphasis: true },
    price: entry.price.basePrice,
    qty: entry.quantity ?? 1,
    total: entry.price.basePrice
  };
}

export function buildOptionRow(entry: ProductSummaryDetailWithPrice): TableRow {
  return {
    item: entry.title ?? entry.name,
    meta: { indented: true },
    price: entry.price.basePrice,
    qty: entry.quantity,
    total: entry.price.basePrice
  };
}

export function buildDetailRow(
  detail: ProductSummaryDetail | ProductSummaryDetailWithPrice
): TableRow {
  switch (detail.name) {
    case "term":
      return {
        item: parseBillingCycle(detail.cycle ?? 0).numeric,
        meta: { detail: true, term: true }
      };
    default:
      return {
        item: detail.title ?? detail.name,
        meta: { detail: true, indented: true },
        price: "price" in detail ? detail.price.basePrice : "",
        qty: detail.quantity
      };
  }
}
