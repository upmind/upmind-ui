import { ref } from "vue";
import { remove as removeFromRegistry } from "../scope";
import { useActiveSession } from "../session-store";
import { invalidateQueryByKey } from "../query";
import service, { useClientEmailServices } from "./client-email.services";
import { set } from "lodash-es";
import type { Email, EmailModel } from "./client-email.types";
import type { RequestFilters } from "../query";
// -----------------------------------------------------------------------------
/**
 * @module client-email/useClientEmails.actions
 * @description Client-emails collection actions factory (mutations, refresh,
 * pagination, filtering, readiness + lifecycle).
 */

/** The reactive list query minted by `service.loadList`. */
type EmailListQuery = ReturnType<typeof service.loadList>;

/**
 * Creates the client-emails collection actions.
 * @internal
 */
export function createClientEmailsActions(
  query: EmailListQuery,
  scopeKey: string
) {
  const { isReady: ensureAuth } = useActiveSession().useActions();
  const { isAuthenticated } = useActiveSession().useMeta();

  /**
   * Resolves once the collection is ready to read. If already authenticated it
   * waits for the first fetch; otherwise it ensures auth then refetches.
   */
  async function isReady(): Promise<boolean> {
    if (isAuthenticated.value)
      return new Promise(resolve => {
        const interval = setInterval(() => {
          if (query.isFetched.value) {
            clearInterval(interval);
            resolve(true);
          }
        }, 100);
      });
    return ensureAuth()
      .then(ok => (ok ? query.refetch().then(() => true) : false))
      .catch(() => false);
  }

  /** Finds or creates an email for the active client, resolving the record. */
  function ensure(model: EmailModel): Promise<Email> {
    return useClientEmailServices().ensure({ model }) as Promise<Email>;
  }

  function remove(id: Email["id"]) {
    return service.remove(id).mutate();
  }

  function setDefault(id: Email["id"]) {
    return service.setDefault(id).mutate();
  }

  function verify(id: Email["id"]) {
    return service.verify(id).mutate();
  }

  // --- filters
  const filters = ref<RequestFilters & { query?: string }>({});

  const filterQuery = (value?: string) => {
    set(filters.value, "query", value);
    query.filter(filters.value);
  };

  /**
   * Destroys this scoped instance — removes it from the registry so the next
   * `.as()` mints a fresh collection. Query-backed (no service to stop); the
   * registry's effect scope teardown disposes the query's watchers.
   */
  function destroy(): void {
    removeFromRegistry(scopeKey);
  }

  // ---------------------------------------------------------------------------
  return {
    /** Destroys this scoped instance — removes it from the registry. */
    destroy,

    /** Finds or creates an email for the active client. */
    ensure,

    /** Filters for the list query (matches title/description). */
    filters: {
      query: filterQuery
    },

    /** Invalidates the cached list so the next read refetches. */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /** Resolves true when the collection is ready to read, false on error. */
    isReady,

    /** Fetches the next page of emails. */
    nextPage: query.fetchNextPage,

    /** Fetches the previous page of emails. */
    prevPage: query.fetchPreviousPage,

    /** Refetches the list from the server. */
    refresh: query.refetch,

    /** Removes an email by id. */
    remove,

    /** Sets an email as the client's default. */
    setDefault,

    /** Sends a verification email for the given email id. */
    verify
  };
}

// Type export for consumers
export type UseClientEmailsActions = ReturnType<
  typeof createClientEmailsActions
>;
