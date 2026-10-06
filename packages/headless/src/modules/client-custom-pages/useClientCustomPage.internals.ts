import type { CustomPageQuery } from "./client-custom-pages.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-custom-pages/useClientCustomPage.internals
 * @description Single-read internals (debugging). Exposes the raw TanStack
 * query object backing this read.
 * @doctrine clause 1 (uniform four-layer default) — TanStack-variant form.
 */
export function createClientCustomPageInternals(
  actorScope: ScopeActorTypes,
  query: CustomPageQuery
) {
  return {
    /** Actor scope for this instance. */
    actorScope,
    /** Raw TanStack query object backing this read. */
    query
  };
}

// Type export for consumers
export type UseClientCustomPageInternals = ReturnType<
  typeof createClientCustomPageInternals
>;
