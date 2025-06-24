// --- external
import { computed, ref } from "vue";

// --- internal
import service from "./services";
import { invalidateQueryByKey } from "../query";

// --- utils
import { get, set, find, every, isEmpty, includes, isString } from "lodash-es";

// --- types
import type { Product } from "../product";
import type { ICurrency } from "@upmind-automation/types";
import type { QueryProps, RequestFilters } from "../query";

export const useProductCatalogue = (
  initial?: QueryProps & {
    infinite?: boolean;
  }
) => {
  // --- state
  const { infinite, ...params } = initial || {};
  const query = infinite
    ? service.loadInfinite(params)
    : service.loadList(params);

  const meta = computed(() => ({
    isLoading: query?.isFetching.value,
    hasError: !isEmpty(query.error.value),
    isEmpty: isEmpty(query?.data?.value) || query.pagination.value.total == 0,
    isAvailable: true,
    ...query?.meta.value,
  }));

  async function isReady(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      resolve(true);
    });
  }

  // --- context

  // --- methods

  function getOne(id: Product["id"]) {
    return find(query.data.value || [], ["id", id]);
  }

  function findOne(mapping: string | Partial<Product>) {
    if (isString(mapping)) {
      return find(
        query.data.value || [],
        (item: Product) =>
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

    return find(query.data.value || [], (item: Product) =>
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
      query: string;
      currency: string;
      "filter[products_category_id]": string;
      id: string[];
      promotions: string[];
    }
  >({
    id: [],
    query: "",
    currency: "",
    promotions: [],
    "filter[products_category_id]": "",
  });

  const filterQuery = (value?: string) => {
    set(filters.value, "query", value || "");
    query.filter(filters.value);
  };

  const filterCurrency = (value?: ICurrency["code"]) => {
    set(filters.value, "currency", value || "");
    query.filter(filters.value);
  };

  const filterProductCategory = (value?: string) => {
    set(filters.value, "filter[products_category_id]", value ?? "");
    query.filter(filters.value);
    query.resetQuery().then(() => {
      query.refetch();
    });
  };

  const filterIds = (value?: string[]) => {
    set(filters.value, "id", value || []);
    query.filter(filters.value);
  };

  const filterCoupons = (value?: string[]) => {
    set(filters.value, "promotions", value || []);
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
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    /**
     * Filters for the query.
     * These filters can be used to modify the query parameters before fetching the data.
     * @type {RequestFilters & { query?: string, currency?: string, "filter[products_category_id]"?: string}}
     * @property ids - Filter for the product ids.
     * @property query - Filter for the query. i.e., name/description/excerpt
     * @property coupons - Filter for the coupons.
     * @property currency - Filter for the currency code.
     * @property productCategory - Filter for the product category id.
     */
    filters: {
      ids: filterIds,
      query: filterQuery,
      coupons: filterCoupons,
      currency: filterCurrency,
      productCategory: filterProductCategory,
    },
  };
};

export type UseProductCatalogue = ReturnType<typeof useProductCatalogue>;
