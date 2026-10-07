import { computed } from "vue";
import { mapToHeadlessError } from "../../utils";
import type {
  LegacyInvoiceItemQuery,
  LegacyInvoicesServices
} from "./legacy-invoices.types";
import type { ResponseError } from "../../utils";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module legacy-invoices/useLegacyInvoice.context
 * @description Single-read context — the mapped record, whole (D-16): its
 * top level and its preserved bill (`content`) together. Query-backed: data
 * is mapped in `legacy-invoices.services.ts` via `select`, never here.
 *
 * ERRORS ARE STATE, NOT EVENTS. `error` is the scope's captured failure,
 * exposed for the consumer to render. This layer never raises it.
 *
 * @doctrine clause 2 — shared-only (armless).
 *
 * @decision
 * what: this file, `useLegacyInvoice.context.ts`, exists although the query
 * template ships no matching template file for it.
 * why: `templates/SINGLE-READ.md` step 1 instructs copying the collection's
 * own `.context.ts` and renaming it for the single read — the same layer
 * over an item query, not a different contract.
 * rejected: leaving this layer unwritten — clause 1 requires the uniform
 * four-layer return on both composables.
 */
export function createLegacyInvoiceContext(
  _actorScope: ScopeActorTypes,
  service: LegacyInvoicesServices,
  query: LegacyInvoiceItemQuery
) {
  const error = computed<ResponseError | undefined>(
    () =>
      service.error.value ??
      (query.error.value ? mapToHeadlessError(query.error.value) : undefined)
  );

  // --- actor-specific context: none earned yet (clause 2). When a scope
  // earns one, add `useLegacyInvoice.context.{actor}.ts` and spread it LAST.

  return {
    /** The reactive mapped record this scope resolved — whole (D-16). */
    data: query.data,

    /** The scope's captured error — read, never raised. */
    error

    // The arm merges in HERE, last.
    // ...actorContext
  };
}

// Type export for consumers
export type UseLegacyInvoiceContext = ReturnType<
  typeof createLegacyInvoiceContext
>;
