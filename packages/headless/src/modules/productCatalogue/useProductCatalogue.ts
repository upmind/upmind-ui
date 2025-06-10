// --- internal
import service from "./services";
import { invalidateQueryByKey } from "../query";

// --- utils
import { useTime } from "../../utils";
import { find, filter, includes, isString, every, get } from "lodash-es";

// --- types
import type { Product } from "../product";
import type { PaginatedParams } from "../query";
import type { QueryKey } from "@tanstack/vue-query";

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
   * @return {Promise<Product[]>} A promise that resolves with the retrieved data.
   */
  async function getAll(): Promise<Product[]> {
    return service.loadAll();
  }

  /**
   * Retrieves all products from the cache.
   *
   * @return {Product[]} An array of Product objects retrieved from the cache.
   */
  function getCached(): Product[] {
    return service.loadCached();
  }

  /**
   * Retrieves a single product by its unique identifier.
   *
   * @param {Product["id"]} id - The unique identifier of the product to retrieve.
   * @return {Product | undefined} The product matching the provided identifier if found, otherwise undefined.
   */
  function getOne(id: Product["id"]): Product | undefined {
    const items = getCached();
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
    const items = getCached();
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
   * @param {PaginatedParams} params - The parameters to control pagination such as page number, size, and filters.
   * @return {Promise<Product[]>} A promise that resolves to an array of products for the requested page.
   */
  async function getPaged(params: PaginatedParams): Promise<Product[]> {
    return service.load(params);
  }

  /**
   * Filters a list of products based on a given search parameter.
   *
   * @param {string} param - The search keyword used to filter products. Case-insensitive.
   * @return {Product[]} - An array of products that match the given search parameter.
   */
  function filterProducts(param: string): Product[] {
    const items = getCached();
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
    isReady,
    // getAll,
    getOne,
    filter: filterProducts,
    findOne,
    getPaged,
    getCached,
    invalidate: (key?: QueryKey) =>
      invalidateQueryByKey(key ?? service.queryKey),
  };
};
