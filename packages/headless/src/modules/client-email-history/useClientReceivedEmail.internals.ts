import type { ReceivedEmailItemQuery } from "./client-email-history.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-email-history/useClientReceivedEmail.internals
 * @description Single-read internals (debugging). Exposes the raw TanStack
 * query object backing this read.
 * @doctrine clause 1 (uniform four-layer default) — TanStack-variant form.
 */
export function createClientReceivedEmailInternals(
  actorScope: ScopeActorTypes,
  query: ReceivedEmailItemQuery
) {
  return {
    /** Actor scope for this instance. */
    actorScope,
    /** Raw TanStack query object backing this read. */
    query
  };
}

// Type export for consumers
export type UseClientReceivedEmailInternals = ReturnType<
  typeof createClientReceivedEmailInternals
>;
