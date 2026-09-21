import { computed } from "vue";
import { mapToHeadlessError } from "../../utils";
import type {
  InvoiceItemQuery,
  InvoiceUnpaidAmountQuery,
  InvoicesServices
} from "./invoices.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module invoices/useInvoice.context
 * @description Single-read context — the mapped invoice, its captured error,
 * and AC1's standalone live unpaid amount. Query-backed: data is mapped in
 * `invoices.services.ts` via `select`, never here.
 *
 * ERRORS ARE STATE, NOT EVENTS. `error` is the scope's captured failure,
 * exposed for the consumer to render. This layer never raises it.
 *
 * @doctrine clause 2 — shared-only (armless).
 */
export function createInvoiceContext(
  _actorScope: ScopeActorTypes,
  service: InvoicesServices,
  query: InvoiceItemQuery,
  unpaidAmountQuery: InvoiceUnpaidAmountQuery
) {
  // Folds in the unpaid-amount read's own error (W1) — otherwise a failed
  // AC1 re-read is unobservable on this layer too.
  const error = computed<ResponseError | undefined>(
    () =>
      service.error.value ??
      (query.error.value ? mapToHeadlessError(query.error.value) : undefined) ??
      (unpaidAmountQuery.error.value
        ? mapToHeadlessError(unpaidAmountQuery.error.value)
        : undefined)
  );

  // --- actor-specific context: none earned yet (clause 2). When a scope
  // earns one, add `useInvoice.context.{actor}.ts` and spread it LAST.

  return {
    /** The reactive mapped invoice this scope resolved. */
    data: query.data,

    /** The scope's captured error — read, never raised. */
    error,

    /** AC1 — the live unpaid amount, re-read independently of the invoice. */
    unpaidAmount: unpaidAmountQuery.data

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers
export type UseInvoiceContext = ReturnType<typeof createInvoiceContext>;
