import { computed, toValue, watch, type MaybeRefOrGetter } from "vue";
import { useBasket } from "../basket";
import { useProductCategories } from "../product-categories";
import { invalidateQueryByKey, RequestSortDirection } from "../query";
import service from "./product-catalogue.services";
import {
  get,
  find,
  every,
  isEmpty,
  includes,
  isString,
  isArray
} from "lodash-es";
import type { Product } from "../product";
import type { QueryProps, RequestFilters } from "../query";

/**
 * Properties by which products can be sorted.
 */
export enum ProductSortableProperties {
  DEFAULT = "order",
  NAME = "name",
  PRICE = "price"
}

// -----------------------------------------------------------------------------

/**
 * A composable function that manages the product catalogue.
 * It provides methods to filter, sort, and retrieve products from the catalogue.
 * @param {QueryProps} initial - Initial query parameters for the product catalogue.
 * @returns The {@link UseProductCatalogue} composable methods and state for the product catalogue.
 */
export const useProductCatalogue = (
  initial?: QueryProps & {
    infinite?: boolean;
    includeDescendants?: boolean;
    categoryId?: MaybeRefOrGetter<string | undefined>;
    search?: MaybeRefOrGetter<string | undefined>;
    sortBy?: MaybeRefOrGetter<ProductSortableProperties | undefined>;
    direction?: MaybeRefOrGetter<RequestSortDirection | undefined>;
  }
) => {
  // --- state
  const { isReady: isBasketReady } = useBasket();
  // Resolve category scoping the same way we resolve basket/currency — by
  // calling the composable, not by having the caller pass it in. Cache-shared
  // via a stable query key, so this adds no extra fetch.
  const { getCategoryIds } = useProductCategories();
  const {
    infinite,
    includeDescendants = true,
    categoryId,
    search,
    sortBy,
    direction,
    ...params
  } = initial || {};

  const query = !infinite
    ? service.loadList(params)
    : service.loadInfinite(params);

  const meta = computed(() => ({
    isLoading: query.isFetching.value || !query.isFetched.value,
    hasError: !isEmpty(query.error.value),
    isEmpty: isEmpty(query.data?.value) || query.pagination.value.total == 0,
    isAvailable: true,
    ...query?.meta.value
  }));

  async function isReady(): Promise<boolean> {
    return isBasketReady();
  }

  // --- context

  // --- methods

  function getOne(id: Product["id"]) {
    return find(query.data.value ?? [], ["id", id]);
  }

  function findOne(mapping: string | Partial<Product>) {
    if (isString(mapping)) {
      return find(
        query.data.value ?? [],
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

    return find(query.data.value ?? [], (item: Product) =>
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

  // The category id expanded to its subtree (re-derived when the async tree
  // loads) as the comma-separated IN filter the backend needs, plus free text.
  const queryFilters = computed<RequestFilters>(() => ({
    "filter[products_category_id]": getCategoryIds(
      toValue(categoryId),
      includeDescendants
    ).join(","),
    query: toValue(search) || ""
  }));

  const querySort = computed<QueryProps["sort"]>(() => {
    const property = toValue(sortBy);
    if (!property) return undefined;
    return [toValue(direction) ?? RequestSortDirection.ASC, property];
  });

  // Apply the derived params. Separate watchers so a filter change doesn't churn
  // the sort key, and vice versa. The page reset on a genuine filter/sort change
  // is owned by the query layer (useQuery), not wired here.
  watch(queryFilters, value => query.filter(value), { immediate: true });
  watch(querySort, value => query.sort(value), { immediate: true });

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
    data: computed(() => {
      const data = query.data.value;
      return isArray(data) ? data : null;
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
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false })
  };
};

/**
 * The return type of the {@link useProductCatalogue} composable function.
 */
export type UseProductCatalogue = ReturnType<typeof useProductCatalogue>;
