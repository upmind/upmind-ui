// --- external
import { ref, computed } from "vue";

// --- internal
import service from "./services";
import { useSession } from "../../session";
import { invalidateQueryByKey } from "../../query";

// --- utils
import {
  get,
  set,
  find,
  every,
  isEmpty,
  includes,
  isString,
  isEqual,
} from "lodash-es";

// --- types
import type { Address } from "./types";
import type { QueryProps, RequestFilters } from "../../query";

export const useClientAddresses = (
  initial: QueryProps = {
    pagination: {
      limit: 0,
    },
  }
) => {
  // --- state

  const { isAuthenticated, meta: sessionMeta } = useSession();

  const query = service.loadList(initial);

  const meta = computed(() => ({
    isLoading: query?.isFetching.value,
    hasError: !isEmpty(query.error.value),
    isEmpty: isEmpty(query?.data?.value) || query.pagination.value.total == 0,
    isAvailable: sessionMeta.value.isAuthenticated,
    ...query?.meta.value,
  }));

  async function isReady(): Promise<boolean> {
    return isAuthenticated()
      .then(() =>
        query
          .refetch()
          .then(() => true)
          .catch(() => false)
      )
      .catch(() => false);
  }

  // --- context

  // --- methods

  function getOne(id?: Address["id"]) {
    if (isEmpty(id)) return undefined;
    return find(query.data.value || [], ["id", id]);
  }

  function findOne(mapping: string | Partial<Address>) {
    if (isString(mapping)) {
      return find(
        query.data.value || [],
        item =>
          includes(item.title.toLowerCase(), mapping.toLowerCase()) ||
          includes(item.description.toLowerCase(), mapping.toLowerCase())
      );
    }

    return find(query.data.value, item =>
      every(mapping, (value, key) => {
        if (key == "id") {
          return item.id == value;
        }
        const modelValue = get(item, key);
        return isEqual(modelValue, value);
      })
    );
  }

  function remove(id: Address["id"]) {
    return service.remove(id).mutate();
  }

  function getDefault() {
    return find(query.data.value || [], "meta.isDefault") as
      | Address
      | undefined;
  }

  function setDefault(id: Address["id"]) {
    return service.setDefault(id).mutate();
  }

  // --- filters

  const filters = ref<
    RequestFilters & {
      query?: string;
    }
  >({
    query: "",
  });

  const filterQuery = (value?: string) => {
    set(filters.value, "query", value || "");
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
     * @property {boolean} isError - Indicates if there was an error during the query.
     * @property {boolean} isEmpty - Indicates if the address list is empty.
     * @property {boolean} isLoading - Indicates if the query is currently loading.
     * @property {boolean} isAuthenticated - Indicates if the user is authenticated.
     */
    meta,

    // --- context

    /**
     * The reactive data property containing the list of client items.
     * This is populated by the query and updates automatically when the query state changes.
     */
    data: query.data,

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
     * @returns {Address} The default address if found, is otherwise undefined.
     */
    default: computed(() => getDefault()),
    // --- methods

    /**
     * Get a single address by id.
     * @param id The id of the address to get.
     * @returns The address object if found, is otherwise undefined.
     */
    getOne,

    /**
     * Get all the items from the cache.
     * @returns An array of parsed items if found, otherwise an empty array.
     */
    getCached: service.loadCached,

    /**
     * Find a single address based on the given param. The param is matched against the title and description.
     * @param mapping The filter to match against the address title and description.
     * @returns The address object if found, is otherwise undefined.
     */
    findOne,

    /**
     * Remove an address by id.
     * @param id The id of the address to remove.
     * @returns A promise that resolves when the address is removed.
     */
    remove,

    /**
     * Set an address as default.
     * @param id The id of the address to set as default.
     * @returns A promise that resolves when the address is set as default.
     */
    setDefault,

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

    /**
     * Filters for the query.
     * These filters can be used to modify the query parameters before fetching the data.
     * @type {RequestFilters & { query?: string }}
     * @property query - The search query to filter the client addresses by title or description.
     */
    filters: {
      query: filterQuery,
    },
  };
};

export type UseClientAddresses = ReturnType<typeof useClientAddresses>;
