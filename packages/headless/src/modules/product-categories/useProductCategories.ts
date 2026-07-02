import { computed } from "vue";
import { invalidateQueryByKey } from "../query";
import service from "./product-categories.services";
import {
  get,
  map,
  find,
  every,
  filter,
  isEmpty,
  includes,
  isString,
  reduce,
  concat,
  isArray
} from "lodash-es";
import type { QueryProps } from "../query";
import type { ProductCategory } from "./product-categories.types";

// -----------------------------------------------------------------------------

/**
 * A composable function that manages and interacts with product categories.
 * Provides reactive state and utilities for handling hierarchical category structures.
 * The primary use case is to interact with category data via query operations.
 * @param {QueryProps} initial - Initial query parameters for loading product categories.
 * @returns The {@link UseProductCategories} composable methods and state for product categories.
 */
export const useProductCategories = (initial?: QueryProps) => {
  // --- state

  const query = service.loadList(initial);

  const meta = computed(() => ({
    isLoading: query?.isLoading.value || !query.isFetched.value,
    hasError: !isEmpty(query.error.value),
    isEmpty: isEmpty(query.data?.value),
    isAvailable: query.isFetched.value
  }));

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
  // --- utils

  /** generate a utility walker to tak all categories( data) and take their children iterative and add them to a flattened lit of categories */
  function flattenCategories(categories: ProductCategory[]): ProductCategory[] {
    const flattened: ProductCategory[] = [];
    const walk = (category: ProductCategory) => {
      flattened.push(category);
      if (category?.children) {
        category?.children.forEach(child => walk(child));
      }
    };
    categories.forEach(category => walk(category));
    return flattened ?? [];
  }

  // --- context

  const dataFlattened = computed(() => {
    return flattenCategories(
      isArray(query.data?.value) ? query.data.value : []
    );
  });

  // --- methods

  function walkPath(
    targetId: string,
    categories: ProductCategory[]
  ): ProductCategory[] {
    return reduce(
      categories,
      (result: ProductCategory[], category: ProductCategory) => {
        if (result.length) return result;
        if (category.id === targetId) return [category];
        if (category.children?.length) {
          const childPath = walkPath(targetId, category.children);
          if (childPath.length) return concat([category], childPath);
        }
        return result;
      },
      []
    );
  }

  function getOne(id: ProductCategory["id"]) {
    return find(dataFlattened.value, ["id", id]);
  }

  function findOne(mapping: string | Partial<ProductCategory>) {
    if (isString(mapping)) {
      return find(
        dataFlattened.value,
        item =>
          includes(item.title.toLowerCase(), mapping.toLowerCase()) ||
          includes(item?.description?.toLowerCase(), mapping.toLowerCase()) ||
          includes(item?.excerpt?.toLowerCase(), mapping.toLowerCase())
      );
    }

    return find(dataFlattened.value, item =>
      every(mapping, (value, key) => {
        if (key == "id") {
          return item.id == value;
        }
        const modelValue = get(item, key);
        return modelValue == value;
      })
    );
  }

  function filterAll(param?: string, parent?: ProductCategory["parent"]) {
    const categories = parent ? getChildren(parent, true) : dataFlattened.value;

    if (!param) return categories;

    return filter(categories, item =>
      includes(item.title.toLowerCase(), param.toLowerCase())
    );
  }

  function getChildren(
    parent: ProductCategory["parent"],
    flattened?: boolean
  ): ProductCategory[] {
    const children = filter(dataFlattened.value, ["parent", parent]);

    if (flattened) return flattenCategories(children);

    return children;
  }

  function getParent(id: ProductCategory["id"]) {
    return getOne(id)?.parent;
  }

  function getCategoryIds(
    id?: ProductCategory["id"],
    includeDescendants = true
  ): ProductCategory["id"][] {
    if (!id) return [];
    if (!includeDescendants) return [id];
    return concat([id], map(getChildren(id, true), "id"));
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
    data: computed(() => {
      const data = query.data.value;
      return isArray(data) ? data : null;
    }),

    dataFlattened,

    /**
     * The current error state of the query.
     * This will be populated if the query fails to fetch data.
     */
    error: query.error,

    // --- methods

    getPath: (categoryId?: ProductCategory["id"]) =>
      !categoryId
        ? []
        : walkPath(
            categoryId,
            isArray(query.data?.value) ? query.data.value : []
          ),

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
     * Get the children of a parent category.
     * @param parent The parent category id to get the children for.
     * @returns An array of child categories.
     */
    getChildren,

    /**
     * Get the parent of a category.
     * @param id The id of the category to get the parent for.
     * @returns The parent category if found, is otherwise undefined.
     */
    getParent,

    /**
     * Get the category id plus the ids of its descendants — for scoping a
     * catalogue read to the category and all its subcategories.
     * @param id The id of the category at the root.
     * @param includeDescendants Include descendant ids; pass false to scope to
     * the single category. Defaults to true.
     * @returns An array of category ids: `[id, ...descendants]` by default,
     * `[id]` when descendants are excluded, or `[]` when no id is given.
     */
    getCategoryIds,

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
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false })
  };
};

/**
 * The return type of the {@link useProductCategories} composable function.
 */
export type UseProductCategories = ReturnType<typeof useProductCategories>;
