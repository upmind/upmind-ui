import { computed, ref } from "vue";
import service from "./client-custom-fields.services";
import { useCollection } from "../../utils";
import { set, isEmpty, isArray } from "lodash-es";
import type { CustomField } from "./client-custom-fields.types";
import type { QueryProps, RequestFilters } from "../query";

/**
 * Composable function for managing client phones.
 * It handles fetching, displaying, filtering, and performing actions on client phones,
 * leveraging an underlying service and TanStack Query for data management.
 *
 * @param initial - Optional initial query parameters for loading the phone list. Defaults to pagination limit of 0.
 * @returns The {@link useClientCustomFields} API for interacting with client phones.
 */
export const useClientCustomFields = (
  initial: QueryProps = {
    pagination: {
      limit: 0
    }
  }
) => {
  // --- state

  const query = service.loadList(initial);

  const meta = computed(() => ({
    isLoading: query?.isLoading.value || !query.isFetched.value,
    hasError: !isEmpty(query.error.value),
    isEmpty: isEmpty(query.data?.value) || query.pagination.value.total == 0,
    isAvailable: query.isFetched.value
  }));

  const { findOne, getOne, getDefault } = useCollection<CustomField>(
    query.data
  );

  // --- readiness check
  async function isReady(): Promise<boolean> {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (meta.value.isAvailable) {
          clearInterval(interval);
          resolve(!meta.value.hasError);
        }
      }, 100);
    });
  }

  // --- filters

  const filters = ref<
    RequestFilters & {
      query?: string;
    }
  >({
    query: ""
  });

  const filterQuery = (value?: string) => {
    set(filters.value, "query", value ?? "");
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
     * @typedef {Object} ClientPhoneMeta
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
    data: computed(() => (isArray(query.data.value) ? query.data.value : [])),

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

    /**
     * The default item for the current client.
     * This is the company that is set as default for the current client.
     * @returns {CustomField} The default address if found, is otherwise undefined.
     */
    default: getDefault,

    // --- methods

    /**
     * Get a single address by id.
     * @param id The id of the address to get.
     * @returns The address object if found, is otherwise undefined.
     */
    getOne,

    /**
     * Find a single address based on the given param. The param is matched against the title and description.
     * @param mapping The filter to match against the address title and description.
     * @returns The address object if found, is otherwise undefined.
     */
    findOne,

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
    // invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /**
     * Filters for the query.
     * These filters can be used to modify the query parameters before fetching the data.
     * @type {RequestFilters & { query?: string }}
     * @property query - The search query to filter the client phones by title or description.
     */
    filters: {
      query: filterQuery
    }
  };
};

/**
 * The return type of the {@link UseClientCustomFields} composable function.
 */
export type UseClientCustomFields = ReturnType<typeof useClientCustomFields>;
