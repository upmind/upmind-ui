// --- internal
import service from "./services";
import { invalidateQueryByKey } from "../query";

// --- utils
import { useTime } from "../../utils";
import { find, filter, includes, isString, every, get } from "lodash-es";

// --- types
import type { Product } from "../product";
import type { IProductCategory } from "@upmind-automation/types";

/**
 * Provides utility functions and methods to interact with product categories.
 * Includes functionality for retrieving, caching, filtering, and paginating product data.
 * @function useProductCategories
 */
export const useProductCategories = () => {
  async function isReady(): Promise<void> {
    return Promise.resolve();
  }

  /**
   * Retrieves all product categories from the service.
   *
   * @return {Promise<IProductCategory[]>} A promise that resolves to an array of product categories.
   */
  async function getAll(): Promise<IProductCategory[]> {
    return service.loadAll();
  }

  /**
   * Retrieves all product categories from the cache.
   *
   * @return {IProductCategory[]} An array of product categories retrieved from the cache.
   */
  function getCached(): IProductCategory[] {
    return service.loadCached();
  }

  /**
   * Retrieves a single product category by its unique identifier.
   *
   * @param {Product["id"]} id - The unique identifier of the product to retrieve.
   * @return {IProductCategory | undefined} The product category object if found, otherwise undefined.
   */
  function getOne(id: Product["id"]): IProductCategory | undefined {
    const items = getCached();
    return find(items, ["id", id]);
  }

  /**
   * Finds and returns one item from the cache that matches the provided mapping criteria.
   *
   * @param {string|Partial<IProductCategory>} mapping - A string value used to search in the title, description, or excerpt of the product details,
   * or a partial object of type IProductCategory used to match specific properties of the items.
   * @return {IProductCategory|undefined} The first matching item from the cache, or undefined if no match is found.
   */
  function findOne(
    mapping: string | Partial<IProductCategory>
  ): IProductCategory | undefined {
    const items = getCached();
    if (isString(mapping)) {
      return find(
        items,
        item =>
          includes(item.id.toLowerCase(), mapping.toLowerCase()) ||
          includes(item.name.toLowerCase(), mapping.toLowerCase()) ||
          includes(item.description?.toLowerCase(), mapping.toLowerCase())
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
   * Filters products by their title, description, or excerpt, using a case-insensitive search based on the given parameter.
   *
   * @param {string} param - The search string used to filter the products. Matches are case-insensitive.
   * @return {IProductCategory[]} An array of filtered product categories that match the search string.
   */
  function filterProducts(param: string): IProductCategory[] {
    const items = getCached();
    return filter(
      items,
      item =>
        includes(item.id.toLowerCase(), param.toLowerCase()) ||
        includes(item.name.toLowerCase(), param.toLowerCase()) ||
        includes(item.description?.toLowerCase(), param.toLowerCase())
    );
  }

  return {
    queryOptions: {
      queryKey: service.queryKey,
      queryFn: getAll,
      staleTime: useTime().DAY,
    },
    isReady,
    getAll,
    getOne,
    filter: filterProducts,
    findOne,
    getCached,
    invalidate: invalidateQueryByKey(service.queryKey),
  };
};
