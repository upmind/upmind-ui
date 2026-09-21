import type { InvoiceItemQuery } from "./invoices.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module invoices/useInvoice.internals
 * @description Single-read internals (debugging). Exposes the raw TanStack
 * query object backing this read.
 * @doctrine clause 1 (uniform four-layer default) — TanStack-variant form.
 */
export function createInvoiceInternals(
  actorScope: ScopeActorTypes,
  query: InvoiceItemQuery
) {
  return {
    /** Actor scope for this instance. */
    actorScope,
    /** Raw TanStack query object backing this read. */
    query
  };
}

// Type export for consumers
export type UseInvoiceInternals = ReturnType<typeof createInvoiceInternals>;
