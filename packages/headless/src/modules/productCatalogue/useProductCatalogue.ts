// --- internal
import {
  QueryObserver,
  invalidateQueryByKey,
  useQuerySubscription,
} from "../query";
import service from "./services";

// --- utils
import { useTime } from "../../utils";
import { find, filter, includes, isString, every, get } from "lodash-es";

// --- types
import type { Product } from "../product";
import type { PaginatedParams } from "../query";
import type { QueryKey, QueryCacheNotifyEvent } from "@tanstack/query-core";

let observer: QueryObserver | undefined;

/**
 * Subscribes to a query change event and attaches a callback function to handle updates.
 *
 * This method ensures a query observer is created if it does not already exist and uses it to monitor changes
 * in the associated query. The provided callback function will be invoked whenever the specified query emits
 * an update event.
 *
 * @param {function} callback - A function that will be called whenever the observed query updates. The callback
 *                              receives the updated query as its argument.
 * @returns {QueryObserver} - The observer instance that is used to monitor the query.
 */
const subscribe = (
  callback: (query: QueryCacheNotifyEvent["query"]) => void
): QueryObserver => {
  if (!observer) {
    observer = useQuerySubscription(service.queryKey, callback);
  }
  return observer;
};

/**
 * A function that provides access to and operations on the product catalogue.
 * @function useProductCatalogue
 */
export const useProductCatalogue = () => {
  async function isReady(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Retrieves all available data by invoking the service layer.
   *
   * @param {Object} [options={}] - Optional configuration object.
   * @param {boolean} [options.allowStale=true] - Flag indicating whether stale data is allowed.
   * @return {Promise<Product[]>} A promise that resolves with the retrieved data.
   */
  async function getAll({ allowStale = true } = {}): Promise<Product[]> {
    return service.loadAll({ allowStale });
  }

  /**
   * Retrieves all products from the cache.
   *
   * @return {Product[]} An array of Product objects retrieved from the cache.
   */
  function getAllFromCache(): Product[] {
    return service.loadAllFromCache();
  }

  /**
   * Retrieves a single product by its unique identifier.
   *
   * @param {Product["id"]} id - The unique identifier of the product to retrieve.
   * @return {Product | undefined} The product matching the provided identifier if found, otherwise undefined.
   */
  function getOne(id: Product["id"]): Product | undefined {
    const items = getAllFromCache();
    return find(items, ["id", id]);
  }

  /**
   * Searches for a single product that matches the provided mapping criteria.
   *
   * @param {string | Partial<Product>} mapping - A string to search within product details
   * (title, description, or excerpt), or a partial product object specifying criteria
   * (e.g., `id` or other product properties).
   * @return {Product | undefined} The first matching product if found, otherwise undefined.
   */
  function findOne(mapping: string | Partial<Product>): Product | undefined {
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
   * Retrieves a paginated list of products based on the provided pagination parameters.
   *
   * @param {PaginatedParams} paginationParams - The parameters to control pagination such as page number, size, and filters.
   * @param {Object} [options] - Optional settings for retrieving the paginated data.
   * @param {boolean} [options.allowStale=true] - Whether to allow stale data to be returned.
   * @return {Promise<Product[]>} A promise that resolves to an array of products for the requested page.
   */
  async function getPaged(
    paginationParams: PaginatedParams,
    { allowStale = true }: { allowStale?: boolean } = {}
  ): Promise<Product[]> {
    return service.loadPaged(paginationParams, { allowStale });
  }

  /**
   * Filters a list of products based on a given search parameter.
   *
   * @param {string} param - The search keyword used to filter products. Case-insensitive.
   * @return {Product[]} - An array of products that match the given search parameter.
   */
  function filterProducts(param: string): Product[] {
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
    // getAll,
    getOne,
    filter: filterProducts,
    findOne,
    getPaged,
    getAllFromCache,
    invalidate: (key?: QueryKey) =>
      invalidateQueryByKey(key ?? service.queryKey),
  };
};
