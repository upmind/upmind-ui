import service from "./client-email.services";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module client-email/useClientEmails.internals
 * @description Client-emails collection internals sub-composable (debugging).
 */

/** The reactive list query minted by `service.loadList`. */
type EmailListQuery = ReturnType<typeof service.loadList>;

/**
 * Creates the client-emails collection internals for debugging.
 * @internal
 */
export function createClientEmailsInternals(
  query: EmailListQuery,
  actorScope: ScopeActorTypes
) {
  return {
    /** Actor scope for this instance. */
    actorScope,
    /** Raw TanStack query object backing the collection. */
    query
  };
}

// Type export for consumers
export type UseClientEmailsInternals = ReturnType<
  typeof createClientEmailsInternals
>;
