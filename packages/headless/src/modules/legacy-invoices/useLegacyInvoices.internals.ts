import { translateQuery } from "../query";
import type { QueryProps } from "../query";
import type {
  LegacyInvoicesListQuery,
  LegacyInvoicesServices
} from "./legacy-invoices.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module legacy-invoices/useLegacyInvoices.internals
 * @description Collection internals (debugging). Exposes the raw TanStack
 * query object backing the collection and the wire the live criteria
 * BUILDS — nothing here is requested.
 * @doctrine clause 1 (uniform four-layer default) — TanStack-variant form.
 */
export function createLegacyInvoicesInternals(
  actorScope: ScopeActorTypes,
  query: LegacyInvoicesListQuery,
  _service: LegacyInvoicesServices
) {
  return {
    /** Actor scope for this instance. */
    actorScope,

    /** Raw TanStack query object backing the collection. */
    query,

    /** Diagnostics: the wire the live criteria BUILDS — nothing is requested. */
    translateQuery: (): QueryProps =>
      translateQuery(query.schema, query.criteria.value)
  };
}

// Type export for consumers
export type UseLegacyInvoicesInternals = ReturnType<
  typeof createLegacyInvoicesInternals
>;
