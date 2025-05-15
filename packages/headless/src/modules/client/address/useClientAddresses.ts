// --- internal
import {
  QueryObserver,
  invalidateQueryByKey,
  useQuerySubscription,
} from "../../query";
import service from "./services";
import { useTime } from "../../../utils";
import { useSession } from "../../session";
import { useFeedback } from "../../feedback";

// --- utils
import { find, filter, includes, isString, every, get } from "lodash-es";

// --- types
import type { Address } from "./types";
import type { PaginatedParams } from "../../query";
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

export const useClientAddresses = () => {
  const { addError, addSuccess } = useFeedback();
  const { isAuthenticated } = useSession();

  /**
   * Check if the client addresses are loaded and ready.
   * @returns A promise that resolves to true when the addresses are ready to be fetched.
   * @example isReady().then(getAll).then(() => console.log("Addresses are ready!"))
   */
  async function isReady(): Promise<void> {
    return isAuthenticated();
  }

  /**
   * Get all the addresses for the current client.
   * @param allowStale Whether to allow stale data. Defaults to true.
   * @returns An array of parsed addresses if found, otherwise an empty array.
   * @example getAll().then(addresses => console.log(addresses))
   */
  async function getAll({ allowStale = true } = {}) {
    return service.loadAll({ allowStale });
  }

  /**
   * Get all the addresses from the cache.
   * @returns An array of parsed addresses if found, otherwise an empty array.
   * @example getAllFromCache().then((addresses) => console.log(addresses))
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
  function getOne(id: Address["id"]) {
    const addresses = getAllFromCache();
    return find(addresses, ["id", id]);
  }

  /**
   * Find a single address based on the given param. The param is matched against the title and description.
   * @param mapping The filter to match against the address title and description.
   * @returns The address object if found, otherwise undefined.
   * @example findOne("home").then((address) => console.log(address))
   */
  function findOne(mapping: string | Partial<Address>) {
    const addresses = getAllFromCache();
    if (isString(mapping)) {
      return find(
        addresses,
        item =>
          includes(item.title.toLowerCase(), mapping.toLowerCase()) ||
          includes(item.description.toLowerCase(), mapping.toLowerCase())
      );
    }

    return find(addresses, item =>
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
   * Get addresses in a paged format.
   * @param paginationParams The pagination parameters to use.
   * @param allowStale Whether to allow stale data. Defaults to true.
   * @returns A promise that resolves to an object containing the addresses and pagination details.
   * @example getPaged({ limit: 10, offset: 0 }) // returns the first 10 addresses if 10 addresses are available
   */
  async function getPaged(
    paginationParams: PaginatedParams,
    { allowStale = true } = {}
  ) {
    return service.loadPaged(paginationParams, { allowStale });
  }

  /**
   * Filters the addresses by name or description.
   * @param param The filter string to filter the addresses with.
   * @returns An array of addresses that match the filter.
   * @example filter("home").then((addresses) => console.log(addresses))
   */
  function filterAddresses(param: string) {
    const addresses = getAllFromCache();
    return filter(
      addresses,
      item =>
        includes(item.title.toLowerCase(), param.toLowerCase()) ||
        includes(item.description.toLowerCase(), param.toLowerCase())
    );
  }

  /**
   * Get the default address for the current client.
   * @returns The default address if found, otherwise undefined.
   * @example getDefault().then((address) => console.log(address))
   */
  async function getDefault() {
    return getAll().then(items => find(items, "meta.isDefault"));
  }

  /**
   * Remove an address by id.
   * @param id The id of the address to remove.
   * @returns A promise that resolves when the address is removed.
   * @example remove("123").then(() => console.log("Address removed"))
   */
  async function remove(id: Address["id"]) {
    return service
      .remove(id)
      .then(() => addSuccess("Successfully removed address"))
      .then(service.refresh)
      .catch(error =>
        addError({
          title: isString(error)
            ? error
            : error?.title || "We experienced an error removing this address",
          copy: error?.message,
          data: error?.data,
        })
      );
  }

  /**
   * Set an address as default.
   * @param id The id of the address to set as default.
   * @returns A promise that resolves when the address is set as default.
   * @example setDefault("123").then(() => console.log("Address set as default"))
   */
  async function setDefault(id: Address["id"]) {
    return service
      .setDefault(id)
      .then(() => addSuccess("Successfully set address as default"))
      .then(service.refresh)
      .catch(error => {
        addError({
          title: isString(error)
            ? error
            : error?.title ||
              "We experienced an error setting this address as default",
          copy: error?.message,
          data: error?.data,
        });
      });
  }

  return {
    queryOptions: {
      queryKey: service.queryKey,
      queryFn: getAll,
      staleTime: useTime().DAY,
    },
    subscribe,
    isReady,
    getOne,
    getAll,
    filter: filterAddresses,
    findOne,
    getPaged,
    getDefault,
    getAllFromCache,
    remove,
    setDefault,
    invalidate: invalidateQueryByKey(service.queryKey),
  };
};
