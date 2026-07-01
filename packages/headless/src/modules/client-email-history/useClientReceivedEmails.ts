import { computed, ref } from "vue";
import { invalidateQueryByKey } from "../query";
import {
  type QueryProps,
  type RequestFilters,
  RequestSortDirection
} from "../query";
import { useActiveSession } from "../session-store";
import service from "./client-email-history.services";
import { set, isEmpty, isArray } from "lodash-es";
import type { ISentEmail } from "@upmind-automation/types";

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
 * @param initial - Optional initial query parameters for loading the email list (e.g. pagination settings). Defaults to pagination limit of 0.
 * @returns The {@link useClientReceivedEmails} API for interacting with client emails.
 */
export const useClientReceivedEmails = (
  initial: QueryProps = {
    pagination: {
      limit: 0
    }
  }
) => {
  // --- state

  const { isReady: ensureAuth } = useActiveSession().useActions();
  const { isAuthenticated } = useActiveSession().useMeta();

  const { ...params } = initial || {};

  const query = service.loadList({ ...params });

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

  // --- filters

  const sort = (
    property?: ReceivedEmailsSortableProperties,
    direction?: RequestSortDirection
  ) => {
    if (!property || isEmpty(property)) {
      query.sort();
    } else {
      query.sort([direction ?? RequestSortDirection.ASC, property]);
    }
  };

  const filters = ref<
    RequestFilters & {
      query?: string;
      subject?: string;
    }
  >({});

  const filterQuery = (value?: string) => {
    set(filters.value, "query", value);
    query.filter(filters.value);
  };

  const filterSubject = (value?: ISentEmail["subject"]) => {
    set(filters.value, "subject", value);
    query.filter(filters.value);
  };

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
     * Sorts the query by the given property and direction.
     * If no property is provided, it clears the sort.
     * @param {string} [property] The property to sort by.
     * @param {RequestSortDirection} [direction=RequestSortDirection.ASC] The direction to sort by.
     * @return {void}
     */
    sort,

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

    /**
     * Filters for the query.
     * These filters can be used to modify the query parameters before fetching the data.
     * @type {RequestFilters & { query?: string }}
     * @property query - The search query to filter the client emails by title or description.
     */
    filters: {
      query: filterQuery,
      subject: filterSubject
    }
  };
};

/**
 * The return type of the {@link useClientReceivedEmails} composable function.
 */
export type useClientReceivedEmails = ReturnType<
  typeof useClientReceivedEmails
>;
