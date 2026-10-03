import type { LegacyInvoiceItemQuery } from "./legacy-invoices.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module legacy-invoices/useLegacyInvoice.internals
 * @description Single-read internals (debugging). Exposes the raw TanStack
 * query object backing this read.
 * @doctrine clause 1 (uniform four-layer default) — TanStack-variant form.
 *
 * @decision
 * what: this file, `useLegacyInvoice.internals.ts`, exists although the
 * query template ships no matching template file for it.
 * why: `templates/SINGLE-READ.md` step 1 instructs copying the collection's
 * own `.internals.ts` and renaming it for the single read.
 * rejected: leaving this layer unwritten — clause 1 requires the uniform
 * four-layer return on both composables.
 */
export function createLegacyInvoiceInternals(
  actorScope: ScopeActorTypes,
  query: LegacyInvoiceItemQuery
) {
  return {
    /** Actor scope for this instance. */
    actorScope,
    /** Raw TanStack query object backing this read. */
    query
  };
}

// Type export for consumers
export type UseLegacyInvoiceInternals = ReturnType<
  typeof createLegacyInvoiceInternals
>;
