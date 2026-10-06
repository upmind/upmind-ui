/**
 * @module invoices/__tests__/invoices.unit-helpers
 * @description A fresh order-history or invoice-list cell for a unit spec: no
 * session, so no request is made, while the actions still write the criteria
 * the context publishes.
 */

import { unref } from "vue";
import { InvoiceCategoryCode } from "@upmind-automation/types";
import { useInvoices } from "..";
import { queryClient } from "../../query/client";
import { getRegistry, remove } from "../../scope/scope.registry";
import { ScopeActorTypes } from "../../scope/scope.types";
import { startsWith } from "lodash-es";

/** The criteria, error and page meta a cell publishes, unwrapped. */
export type CellView = {
  query: {
    filters?: Record<string, unknown>;
    sort?: unknown[];
    pagination?: { limit?: number; offset?: number };
  };
  error: unknown;
  pagination: { page: number; limit: number };
  meta: { hasNextPage: boolean; hasPrevPage: boolean; hasPages: boolean };
};

/** Drops every invoices scope and the query cache, so each spec starts clean. */
export function resetCells(): void {
  for (const key of getRegistry().keys())
    if (startsWith(key, "invoice")) remove(key);
  queryClient.clear();
}

/** A fresh client cell — the order history, or the default invoice list. */
export function openCell(context: "orders" | "invoices" = "orders") {
  resetCells();
  const client = useInvoices().as(ScopeActorTypes.CLIENT);
  const cell =
    context === "orders"
      ? client.for(InvoiceCategoryCode.NEW_CONTRACT as never)
      : client;
  const actions = cell.useActions() as unknown as Record<
    string,
    (...args: unknown[]) => unknown
  > & { filters: Record<string, (...args: unknown[]) => unknown> };
  const published = cell.useContext() as unknown as Record<string, unknown>;
  const meta = cell.useMeta() as unknown as Record<string, unknown>;
  const view = (): CellView => ({
    query: unref(published.query) as CellView["query"],
    error: unref(published.error),
    pagination: unref(published.pagination) as CellView["pagination"],
    meta: {
      hasNextPage: unref(meta.hasNextPage) as boolean,
      hasPrevPage: unref(meta.hasPrevPage) as boolean,
      hasPages: unref(meta.hasPages) as boolean
    }
  });
  return { actions, view, published };
}
