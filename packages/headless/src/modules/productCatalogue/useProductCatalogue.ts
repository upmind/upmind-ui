// --- external
import { computed, ref } from "vue";

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
  set,
} from "lodash-es";

// --- types
import type { QueryParams, RequestFilters } from "../query";
import type { Product } from "../product";
import { ICurrency } from "@upmind-automation/types";

export const useProductCatalogue = (initial?: QueryParams) => {
  // --- state

  const query = service.loadList(initial);

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

  // --- filters

  const filters = ref<
    RequestFilters & {
      currency: string;
      "filter[products_category_id]": string;
      id: string[];
      promotions: string[];
    }
  >({
    currency: "",
    "filter[products_category_id]": "",
    id: [],
    promotions: [],
  });

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

  const filterCurrency = computed({
    get: () => get(filters.value, "currency", ""),
    set: (currencyCode?: ICurrency["code"]) => {
      set(filters.value, "currency", currencyCode || "");
      query.filter(filters.value);
    },
  });

  const filterProductCategory = computed({
    get: () => get(filters.value, "filter[products_category_id]", ""),
    set: (categoryId?: string) => {
      set(filters.value, "filter[products_category_id]", categoryId ?? "");
      query.filter(filters.value);
    },
  });

  const filterIds = computed({
    get: () => get(filters.value, "id", ""),
    set: (ids?: string[]) => {
      set(filters.value, "id", ids || []);
      query.filter(filters.value);
    },
  });

  const filterCoupons = computed({
    get: () => get(filters.value, "promotions", ""),
    set: (coupons?: string[]) => {
      set(filters.value, "promotions", coupons || []);
      query.filter(filters.value);
    },
  });

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
     * @return {boolean|RequestPagination} The pagination object if available, otherwise false.
     */
    pagination: query.pagination,

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
    nextPage: query.fetchNextPage,

    /**
     * Go to the previous page of items.
     * Decrements the page number by 1 if pagination is enabled and the current offset is greater than or equal to the limit.
     * This will only work if the current offset is greater than or equal to the limit.
     * @param value The new pagination parameters to set.
     * @return {void}
     */
    prevPage: query.fetchPrevPage,

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
     * @typedef {Object} ProductCatalogueFilters
     * @property {RequestFilter} currency - Filter for the currency code.
     * @property {RequestFilter} productCategory - Filter for the product category id.
     * @property {RequestFilter} ids - Filter for the product ids.
     * @property {RequestFilter} coupons - Filter for the coupons.
     */
    filters: {
      currency: filterCurrency,
      productCategory: filterProductCategory,
      ids: filterIds,
      coupons: filterCoupons,
    },
  };
};

export type UseProductCatalogue = ReturnType<typeof useProductCatalogue>;
