/**
 * @module invoices/__tests__/invoices.unit-helpers
 * @description A fresh order-history or invoice-list cell for a unit spec: no
 * session, so no request is made, while the actions still write the criteria
 * the context publishes.
 */

import { InvoicesContextTypes, useInvoices } from "..";
import { queryClient } from "../../query/client";
import { getRegistry, remove } from "../../scope/scope.registry";
import { ScopeActorTypes } from "../../scope/scope.types";
import { startsWith } from "lodash-es";

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
      ? client.for(InvoicesContextTypes.NEW_CONTRACT)
      : client;
  const actions = cell.useActions();
  const published = cell.useContext();
  const meta = cell.useMeta();
  const view = () => ({
    query: published.query.value,
    error: published.error.value,
    pagination: published.pagination.value,
    meta: {
      hasNextPage: meta.hasNextPage.value,
      hasPrevPage: meta.hasPrevPage.value,
      hasPages: meta.hasPages.value
    }
  });
  return { actions, view, published };
}
