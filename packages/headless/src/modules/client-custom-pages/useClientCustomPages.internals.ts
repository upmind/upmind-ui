import type { CustomPagesListQuery } from "./client-custom-pages.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-pages/useClientCustomPages.internals
 * @description Collection internals (debugging). Exposes the raw TanStack
 * query object backing the collection.
 * @doctrine clause 1 (uniform four-layer default) — TanStack-variant form.
 */
export function createClientCustomPagesInternals(
  actorScope: ScopeActorTypes,
  query: CustomPagesListQuery
) {
  return {
    /** Actor scope for this instance. */
    actorScope,
    /** Raw TanStack query object backing the collection. */
    query
  };
}

// Type export for consumers
export type UseClientCustomPagesInternals = ReturnType<
  typeof createClientCustomPagesInternals
>;
