import { computed } from "vue";
import { invalidateQueryByKey } from "../query";
import { useActiveSession } from "../session-store";
import service from "./client-email-history.services";
import { isEmpty, isArray } from "lodash-es";
import type { SentEmailQueryModel } from "./client-email-history.types";

/**
 * Properties by which products can be sorted.
 */
export enum ReceivedEmailsSortableProperties {
  DEFAULT = "created_at",
  SUBJECT = "subject"
}

/**
 * Composable function for managing client emails.
 * It handles fetching, displaying, filtering, and performing actions on client emails,
 * leveraging an underlying service and TanStack Query for data management.
 *
 * @param initial - The starting query model (filters · sort · pagination).
 * Untrusted; it takes the same parse → validate path as any criteria write.
 * @returns The {@link useClientReceivedEmails} API for interacting with client emails.
 */
export const useClientReceivedEmails = (
  initial?: Partial<SentEmailQueryModel>
) => {
  // --- state

  const { isReady: ensureAuth } = useActiveSession().useActions();
  const { isAuthenticated } = useActiveSession().useMeta();

  const query = service.loadList(initial);

  const meta = computed(() => ({
    isLoading: query?.isLoading.value || !query.isFetched.value,
    hasError: !isEmpty(query.error.value),
    isEmpty: isEmpty(query.data?.value) || query.pagination.value.total == 0,
    isAvailable: isAuthenticated.value,
    ...query?.meta.value
  }));

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

  // --- context

  // --- mutations

  // ---------------------------------------------------------------------------

  return {
    // --- state

    /**
     * Resolves when the client items are ready to be used.
     * Returns true if ready, false if an error occurred.
     * @returns {Promise<boolean>} A promise resolving to true if ready, false if error.
     */
    isReady,

    /**
     * Meta-information about the basket state.
     * @typedef {Object} ClientEmailMeta
     * @property {boolean} isError - Indicates if there was an error during the query.
     * @property {boolean} isEmpty - Indicates if the basket is empty.
     * @property {boolean} isLoading - Indicates if the query is currently loading.
     * @property {boolean} isAuthenticated - Indicates if the client is authenticated.
     */
    meta,

    // --- context

    /**
     * The reactive data property containing the list of client items.
     * This is populated by the query and updates automatically when the query state changes.
     */
    data: computed(() => {
      return isArray(query.data.value) ? query.data.value : [];
    }),

    /**
     * The current error state of the query.
     * This will be populated if the query fails to fetch data.
     */
    error: query.error,

    /**
     * Indicates if pagination is available
     * If pagination is not set, it defaults to false.
     * Otherwise, it returns the pagination object from the query parameters.
     * @return {boolean|RequestPagination} The pagination object if available, otherwise false.
     */
    pagination: query.pagination,

    // --- methods

    /**
     * Refresh the query to get the latest data.
     * This will refetch the data from the server and update the query state.
     * @returns {void}
     */
    refresh: query.refetch,

    /**
     * Go to the next page of items.
     * Increments the page number by 1 if pagination is enabled and the current offset is less than the total number of items.
     * This will only work if the current offset is less than the total number of items.
     * @param value The new pagination parameters to set.
     * @return {void}
     */
    nextPage: query.fetchNextPage,

    /**
     * Go to the previous page of items.
     * Decrements the page number by 1 if pagination is enabled and the current offset is greater than or equal to the limit.
     * This will only work if the current offset is greater than or equal to the limit.
     * @param value The new pagination parameters to set.
     * @return {void}
     */
    prevPage: query.fetchPreviousPage,

    /**
     * Invalidate the query cache for client items.
     * This will trigger a refetch of the items when the next query is made.
     * @param {boolean} [exact=false] If true, only the exact query key will be invalidated.
     * @return {void}
     */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    // --- criteria

    /**
     * The collection's request state — filters · sort · pagination — as the
     * schema-validated model. Read-only; write through {@link setCriteria}.
     */
    criteria: query.criteria,

    /** What is filterable and sortable at all. */
    schema: query.schema,

    /** Any declared filter column carries a value. */
    isFiltered: query.isFiltered,

    /** ajv's verdict on the last REJECTED criteria write — not a fetch failure. */
    criteriaError: query.criteriaError,

    /**
     * The ONE write verb for the request state. Merges at BRANCH level, and a
     * write that changes the result set returns to the first page.
     */
    setCriteria: query.setCriteria
  };
};

/**
 * The return type of the {@link useClientReceivedEmails} composable function.
 */
export type useClientReceivedEmails = ReturnType<
  typeof useClientReceivedEmails
>;
