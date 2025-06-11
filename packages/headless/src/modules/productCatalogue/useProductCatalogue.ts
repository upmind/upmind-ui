// --- external
import { ref, unref, computed } from "vue";

// --- internal
import service from "./services";
import { invalidateQueryByKey } from "../query";

// --- utils
import {
  get,
  add,
  find,
  every,
  filter,
  isEmpty,
  includes,
  isString,
  isNumber,
  subtract,
} from "lodash-es";

// --- types
import type {
  IAPIPagination,
  QueryListParams,
  QueryListParamsRaw,
} from "../query";
import type { Product } from "../product";

export const useProductCatalogue = (initial?: QueryListParamsRaw) => {
  // --- state

  const queryParams = ref<QueryListParams>(unref(initial ?? {}));

  const query = service.loadList(queryParams);

  const meta = computed(() => ({
    isLoading: query?.isFetching.value,
    hasError: !isEmpty(query.error.value),
    isEmpty: isEmpty(query?.data?.value),
    isAvailable: true,
  }));

  async function isReady(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      resolve(true);
    });
  }

  // --- context

  // --- methods

  function getOne(id: Product["id"]) {
    return find(service.loadCached(), ["id", id]);
  }

  function findOne(mapping: string | Partial<Product>) {
    const items = service.loadCached();
    if (isString(mapping)) {
      return find(
        items,
        item =>
          includes(
            item.productDetails.title.toLowerCase(),
            mapping.toLowerCase()
          ) ||
          includes(
            item.productDetails?.description?.toLowerCase(),
            mapping.toLowerCase()
          ) ||
          includes(
            item.productDetails?.excerpt?.toLowerCase(),
            mapping.toLowerCase()
          )
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
      service.loadCached(),
      item =>
        includes(
          item.productDetails.title.toLowerCase(),
          param.toLowerCase()
        ) ||
        includes(
          item.productDetails?.description?.toLowerCase(),
          param.toLowerCase()
        ) ||
        includes(
          item.productDetails?.excerpt?.toLowerCase(),
          param.toLowerCase()
        )
    );
  }

  function nextPage() {
    const limit = queryParams.value?.pagination?.limit;
    const offset = queryParams.value?.pagination?.offset ?? 0;

    if (isNumber(limit)) {
      queryParams.value.pagination = {
        ...(queryParams.value?.pagination ?? {}),
        offset: add(offset, limit),
      };
    }
  }

  function prevPage() {
    const limit = queryParams.value?.pagination?.limit;
    const offset = queryParams.value?.pagination?.offset ?? 0;

    if (isNumber(limit) && offset >= limit) {
      queryParams.value.pagination = {
        ...(queryParams.value?.pagination ?? {}),
        offset: subtract(offset, limit),
      };
    }
  }

  function setPagination(value: IAPIPagination) {
    queryParams.value.pagination = {
      ...(queryParams.value?.pagination ?? {}),
      ...value,
    };
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
     * Meta information about the basket state.
     * @typedef {Object} BasketMeta
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

    /**
     * Indicates if pagination is available
     * If pagination is not set, it defaults to false.
     * Otherwise, it returns the pagination object from the query parameters.
     * @return {boolean|IAPIPagination} The pagination object if available, otherwise false.
     */
    pagination: computed(
      (): boolean | IAPIPagination => queryParams.value?.pagination ?? false
    ),

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
     * Go to the next page of items.
     * Increments the page number by 1 if pagination is enabled and the current offset is less than the total number of items.
     * This will only work if the current offset is less than the total number of items.
     * @param value The new pagination parameters to set.
     * @return {void}
     */
    nextPage,

    /**
     * Go to the previous page of items.
     * Decrements the page number by 1 if pagination is enabled and the current offset is greater than or equal to the limit.
     * This will only work if the current offset is greater than or equal to the limit.
     * @param value The new pagination parameters to set.
     * @return {void}
     */
    prevPage,

    /**
     * Set the pagination parameters.
     * This updates the current pagination state with the provided values.
     * @param value The new pagination parameters to set.
     * @return {void}
     */
    setPagination,

    /**
     * Invalidate the query cache for client items.
     * This will trigger a refetch of the items when the next query is made.
     * @param {boolean} [exact=false] If true, only the exact query key will be invalidated.
     * @return {void}
     */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),
  };
};

export type UseProductCatalogue = ReturnType<typeof useProductCatalogue>;
