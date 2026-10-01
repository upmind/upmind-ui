// -----------------------------------------------------------------------------
/**
 * @module orders/__tests__/orders.captures
 * @description The design 8.8 capture names of this module and a loader that
 * starts no replay server, so a unit spec can read a capture too.
 */

import { join } from "node:path";
import { getFixture } from "@upmind-automation/test-fixtures";
import type { Fixture } from "@upmind-automation/test-fixtures";

// -----------------------------------------------------------------------------

export const capturesDir = join(import.meta.dirname, "fixtures");

/** The comparisons of design 8.3 that carry an operator-form probe (design 8.8). */
export const PROBED_COMPARISONS: ReadonlyArray<
  readonly [string, readonly string[]]
> = [
  ["number", ["like", "neq"]],
  ["total_amount", ["eq", "neq", "gt", "gte", "lt", "lte"]],
  ["created_at", ["gt", "gte", "lt", "lte", "after", "before"]],
  ["paid_datetime", ["gt", "gte", "lt", "lte", "after", "before"]],
  ["products.product.name", ["like", "eq", "neq"]],
  ["products.product.category.name", ["like", "eq", "neq"]],
  ["products.service_identifier", ["like", "eq", "neq"]]
];

/** The name of the operator-form probe of one design 8.3 comparison. */
export function probeName(column: string, op: string): string {
  return `get-invoices-case-orders-${column.replace(/\./g, "-")}-${op}-probe`;
}

/** Every list capture of design 8.8. No two of them record the same criteria. */
export const LIST_CAPTURES: readonly string[] = [
  "get-invoices-case-orders-default",
  "get-invoices-case-orders-page-2",
  "get-invoices-case-orders-multibrand",
  "get-invoices-case-orders-empty-page",
  "get-invoices-case-orders-past-last-page",
  "get-invoices-case-orders-last-page",
  "get-invoices-case-orders-search",
  "get-invoices-case-orders-status-eq-csv",
  "get-invoices-case-orders-status-neq",
  "get-invoices-case-orders-sort-id",
  "get-invoices-case-orders-sort-total_amount",
  "get-invoices-case-orders-sort-status_id",
  "get-invoices-case-orders-sort-created_at",
  ...PROBED_COMPARISONS.flatMap(([column, ops]) =>
    ops.map(op => probeName(column, op))
  )
];

/** Every single-read capture of design 8.8. */
export const ORDER_CAPTURES: readonly string[] = [
  "get-invoices-id-case-order-paid",
  "get-invoices-id-case-order-unpaid",
  "get-invoices-id-case-order-part-paid",
  "get-invoices-id-case-order-overdue",
  "get-invoices-id-case-order-cancelled-none-paid",
  "get-invoices-id-case-order-refunded",
  "get-invoices-id-case-order-snapshot",
  "get-invoices-id-case-order-not-found"
];

/** The delegated reads of the manager (design 8.1). */
export const DELEGATED_CAPTURES: readonly string[] = [
  "get-products-case-order-images",
  "get-billing-cycles-case-order-items",
  "get-brands-id-gateways-case-online"
];

export const ALL_CAPTURES: readonly string[] = [
  ...LIST_CAPTURES,
  ...ORDER_CAPTURES,
  ...DELEGATED_CAPTURES
];

/** One capture, by its exact design 8.8 name. */
export function capture(name: string): Fixture {
  return getFixture(name, { recordingsDir: capturesDir });
}

/** A deep copy of the recorded response body of one capture. */
export function captured<
  T = { data: Array<Record<string, unknown>>; total: number }
>(name: string): T {
  return structuredClone(capture(name).response.body) as T;
}

/** The recorded request params of one capture. */
export function recordedParams(name: string): URLSearchParams {
  return new URL(capture(name).request.path, "http://x").searchParams;
}
