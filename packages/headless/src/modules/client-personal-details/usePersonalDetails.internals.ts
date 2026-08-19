import type { ClientPersonalDetailsRecordQuery } from "./client-personal-details.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-personal-details/usePersonalDetails.internals
 * @description Read internals (debugging) — the raw TanStack `query` object.
 * @doctrine clause 1 (uniform four-layer default) — TanStack-variant form.
 */
export function createPersonalDetailsInternals(
  actorScope: ScopeActorTypes,
  query: ClientPersonalDetailsRecordQuery
) {
  return {
    /** Actor scope for this instance. */
    actorScope,
    /** Raw TanStack query object backing the read. */
    query
  };
}

// Type export for consumers
export type UsePersonalDetailsInternals = ReturnType<
  typeof createPersonalDetailsInternals
>;
