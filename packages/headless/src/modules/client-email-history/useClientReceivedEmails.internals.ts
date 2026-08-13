import type { ReceivedEmailsListQuery } from "./client-email-history.types";
import type { ScopeActorTypes } from "../scope/scope.types";
// -----------------------------------------------------------------------------
/**
 * @module client-email-history/useClientReceivedEmails.internals
 * @description Collection internals (debugging). Exposes the raw TanStack
 * query object backing the collection.
 * @doctrine clause 1 (uniform four-layer default) — TanStack-variant form.
 */
export function createClientReceivedEmailsInternals(
  actorScope: ScopeActorTypes,
  query: ReceivedEmailsListQuery
) {
  return {
    /** Actor scope for this instance. */
    actorScope,
    /** Raw TanStack query object backing the collection. */
    query
  };
}

// Type export for consumers
export type UseClientReceivedEmailsInternals = ReturnType<
  typeof createClientReceivedEmailsInternals
>;
