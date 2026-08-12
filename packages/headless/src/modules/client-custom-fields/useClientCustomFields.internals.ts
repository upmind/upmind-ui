import type { ClientCustomFieldsListQuery } from "./client-custom-fields.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-fields/useClientCustomFields.internals
 * @description Collection internals (debugging) — the raw TanStack `query`
 * object.
 * @doctrine clause 1 (uniform four-layer default) — TanStack-variant form.
 */
export function createClientCustomFieldsInternals(
  actorScope: ScopeActorTypes,
  query: ClientCustomFieldsListQuery
) {
  return {
    /** Actor scope for this instance. */
    actorScope,
    /** Raw TanStack query object backing the collection. */
    query
  };
}

// Type export for consumers
export type UseClientCustomFieldsInternals = ReturnType<
  typeof createClientCustomFieldsInternals
>;
