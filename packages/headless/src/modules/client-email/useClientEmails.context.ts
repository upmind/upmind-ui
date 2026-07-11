import { computed } from "vue";
import service from "./client-email.services";
import { useCollection } from "../../utils";
import { isArray } from "lodash-es";
import type { Email } from "./client-email.types";
// -----------------------------------------------------------------------------
/**
 * @module client-email/useClientEmails.context
 * @description Client-emails collection context factory — the reactive list and
 * its lookup helpers. Query-backed (no machine): the context reads directly from
 * the shared TanStack query minted once per scope in the composable factory.
 */

/** The reactive list query minted by `service.loadList`. */
type EmailListQuery = ReturnType<typeof service.loadList>;

/**
 * Creates the client-emails collection context (reactive data + lookups).
 * @internal
 */
export function createClientEmailsContext(query: EmailListQuery) {
  const { findOne, getOne, getDefault } = useCollection<Email>(query.data);

  // ---------------------------------------------------------------------------
  return {
    /** The reactive list of the client's emails (always an array). */
    data: computed(() => (isArray(query.data.value) ? query.data.value : [])),

    /** Returns the client's default email, or undefined if none. */
    default: getDefault,

    /** The current error state of the list query, if any. */
    error: query.error,

    /** Finds a single email by a partial mapping (title/description match). */
    findOne,

    /** Finds a single email by id. */
    getOne,

    /** Reactive pagination descriptor for the list query. */
    pagination: query.pagination
  };
}

// Type export for consumers
export type UseClientEmailsContext = ReturnType<
  typeof createClientEmailsContext
>;
