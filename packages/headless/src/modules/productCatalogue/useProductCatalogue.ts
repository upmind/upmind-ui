// --- internal
import {
  QueryObserver,
  invalidateQueryByKey,
  useQuerySubscription,
} from "../query";
import service from "./services";
import { useTime } from "../../utils";

// --- utils
import { find, filter, includes, isString, every, get } from "lodash-es";

// --- types
import type { Product } from "../product/types";
import type { PaginatedParams } from "../query";
import type { QueryCacheNotifyEvent } from "@tanstack/query-core";

let observer: QueryObserver | undefined;

/**
 * Subscribe to the client address query that are present in the cache.
 * This will trigger the callback function when the query is ready/updated.
 * @param callback The callback function to be called when the query is ready/updated.
 * @returns The unsubscribe function
 */
const subscribe = (
  callback: (query: QueryCacheNotifyEvent["query"]) => void
): QueryObserver => {
  if (!observer) {
    observer = useQuerySubscription(service.queryKey, callback);
  }
  return observer;
};

export const useProductCatalogue = () => {
  /**
   * Check if the client items are loaded and ready.
   * @returns A promise that resolves to true when the items are ready to be fetched.
   * @example isReady().then(getAll).then(() => console.log("Products are ready!"))
   */
  async function isReady(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Get all the items for the current client.
   * @param allowStale Whether to allow stale data. Defaults to true.
   * @returns An array of parsed items if found, otherwise an empty array.
   * @example getAll().then(items => console.log(items))
   */
  async function getAll({ allowStale = true } = {}) {
    return service.loadAll({ allowStale });
  }

  /**
   * Get all the items from the cache.
   * @returns An array of parsed items if found, otherwise an empty array.
   * @example getAllFromCache().then((items) => console.log(items))
   * @throws {@link CacheIsStaleError} when the cache is stale
   */
  function getAllFromCache() {
    return service.loadAllFromCache();
  }

  /**
   * Get a single address by id.
   * @param id The id of the address to get.
   * @returns The address object if found, otherwise undefined.
   * @example getOne("123").then((address) => console.log(address))
   */
  function getOne(id: Product["id"]) {
    const items = getAllFromCache();
    return find(items, ["id", id]);
  }

  /**
   * Find a single address based on the given param. The param is matched against the title and description.
   * @param mapping The filter to match against the address title and description.
   * @returns The address object if found, otherwise undefined.
   * @example findOne("home").then((address) => console.log(address))
   */
  function findOne(mapping: string | Partial<Product>) {
    const items = getAllFromCache();
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

  /**
   * Get items in a paged format.
   * @param paginationParams The pagination parameters to use.
   * @param allowStale Whether to allow stale data. Defaults to true.
   * @returns A promise that resolves to an object containing the items and pagination details.
   * @example getPaged({ limit: 10, offset: 0 }) // returns the first 10 items if 10 items are available
   */
  async function getPaged(
    paginationParams: PaginatedParams,
    { allowStale = true } = {}
  ) {
    return service.loadPaged(paginationParams, { allowStale });
  }

  /**
   * Filters the items by name or description.
   * @param param The filter string to filter the items with.
   * @returns An array of items that match the filter.
   * @example filter("home").then((items) => console.log(items))
   */
  function filterProducts(param: string) {
    const items = getAllFromCache();
    return filter(
      items,
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

  return {
    queryOptions: {
      queryKey: service.queryKey,
      queryFn: getPaged,
      staleTime: useTime().DAY,
    },
    subscribe,
    isReady,
    getOne,
    filter: filterProducts,
    findOne,
    getPaged,
    getAllFromCache,
    invalidate: invalidateQueryByKey(service.queryKey),
  };
};
