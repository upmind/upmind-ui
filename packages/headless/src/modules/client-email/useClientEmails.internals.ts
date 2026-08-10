import { translateQuery } from "../query";
import { useActionInputSchemas } from "./client-email.schemas";
import type { QueryProps } from "../query";
import type { ClientEmailListQuery } from "./client-email.types";
import type { ScopeActorTypes } from "../scope";
// -----------------------------------------------------------------------------
/**
 * @module client-email/useClientEmails.internals
 * @description Collection internals (debugging). The query half exposes the
 * raw `query` object; the manager half exposes `send`/`state`/`service`.
 */
export function createClientEmailsInternals(
  actorScope: ScopeActorTypes,
  query: ClientEmailListQuery
) {
  return {
    /**
     * Per-action INPUT schemas, keyed by action id — the map `runGate` reads to
     * decide "input-taking" (ADR-027 Am.6). Absent for non-input actions.
     */
    actionSchemas: useActionInputSchemas(),
    /** Actor scope for this instance. */
    actorScope,
    /** Raw TanStack query object backing the collection. */
    query,
    /** Diagnostics: the wire the live criteria BUILDS — nothing is requested. */
    translateQuery: (): QueryProps =>
      translateQuery(query.schema, query.criteria.value)
  };
}

export type UseClientEmailsInternals = ReturnType<
  typeof createClientEmailsInternals
>;
