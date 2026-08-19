import type { ClientCompanyListQuery } from "./client-company.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-company/useClientCompanies.internals
 * @description Collection internals (debugging). The query half exposes the
 * raw `query` object; the manager half exposes `send`/`state`/`service`.
 * @doctrine clause 1 (uniform four-layer default) — TanStack-variant form.
 */
export function createClientCompaniesInternals(
  actorScope: ScopeActorTypes,
  query: ClientCompanyListQuery
) {
  return {
    /** Actor scope for this instance. */
    actorScope,
    /** Raw TanStack query object backing the collection. */
    query
  };
}

// Type export for consumers
export type UseClientCompaniesInternals = ReturnType<
  typeof createClientCompaniesInternals
>;
