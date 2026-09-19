import { translateQuery } from "../query";
import type { QueryProps } from "../query";
import type { InvoicesListQuery, InvoicesServices } from "./invoices.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module invoices/useInvoices.internals
 * @description Collection internals (debugging). Exposes the raw TanStack
 * query object backing the collection, the resolved target client, and the
 * wire the live criteria BUILDS — nothing here is requested.
 * @doctrine clause 1 (uniform four-layer default) — TanStack-variant form.
 */
export function createInvoicesInternals(
  actorScope: ScopeActorTypes,
  query: InvoicesListQuery,
  service: InvoicesServices
) {
  return {
    /** Actor scope for this instance. */
    actorScope,

    /** The client this scope resolved — the `client x client` receipt. */
    clientId: service.clientId,

    /** Raw TanStack query object backing the collection. */
    query,

    /** Diagnostics: the wire the live criteria BUILDS — nothing is requested. */
    translateQuery: (): QueryProps =>
      translateQuery(query.schema, query.criteria.value)
  };
}

// Type export for consumers
export type UseInvoicesInternals = ReturnType<typeof createInvoicesInternals>;
