// --- external
import { computed } from "vue";

// --- internal
import service from "./services";
import { invalidateQueryByKey } from "../query";

// --- utils
import {
  get,
  find,
  every,
  filter,
  isEmpty,
  includes,
  isString,
} from "lodash-es";

// --- types
import type { QueryProps } from "../query";
import type { ProductCategory } from "./types";

export const useProductCategories = (initial?: QueryProps) => {
  // --- state

  const query = service.loadList(initial);

  const meta = computed(() => ({
    isLoading: query?.isFetching.value,
    hasError: !isEmpty(query.error.value),
    isEmpty: isEmpty(query?.data?.value),
    isAvailable: true,
    count: query?.pagination.value.total,
  }));

  async function isReady(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      resolve(true);
    });
  }

  // --- context

  // --- methods

  function getOne(id: ProductCategory["id"]) {
    return find(query.data.value, ["id", id]);
  }

  function findOne(mapping: string | Partial<ProductCategory>) {
    const items = query.data.value;
    if (isString(mapping)) {
      return find(
        items,
        item =>
          includes(item.title.toLowerCase(), mapping.toLowerCase()) ||
          includes(item?.description?.toLowerCase(), mapping.toLowerCase()) ||
          includes(item?.excerpt?.toLowerCase(), mapping.toLowerCase())
      );
    }

    return find(items, item =>
      every(mapping, (value, key) => {
        if (key == "id") {
          return item.id == value;
        }
        const modelValue = get(item, key);
        return modelValue == value;
      })
    );
  }

  function filterAll(param: string) {
    return filter(
      query.data.value,
      item =>
        includes(item.title.toLowerCase(), param.toLowerCase()) ||
        includes(item?.description?.toLowerCase(), param.toLowerCase()) ||
        includes(item?.excerpt?.toLowerCase(), param.toLowerCase())
    );
  }
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
     * @type {Object} BasketMeta
     * @property {boolean} isError - Indicates if there was an error during the query.
     * @property {boolean} isEmpty - Indicates if the basket is empty.
     * @property {boolean} isLoading - Indicates if the query is currently loading.
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
     * Filters the items by name or description.
     * @param param The filter string to filter the items with.
     * @returns An array of items that match the filter.
     */
    filter: filterAll,

    /**
     * Refresh the query to get the latest data.
     * This will refetch the data from the server and update the query state.
     * @returns {void}
     */
    refresh: query.refetch,

    /**
     * Invalidate the query cache for client items.
     * This will trigger a refetch of the items when the next query is made.
     * @param {boolean} [exact=false] If true, only the exact query key will be invalidated.
     * @return {void}
     */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),
  };
};

export type UseProductCategories = ReturnType<typeof useProductCategories>;
