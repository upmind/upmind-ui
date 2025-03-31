// --- internal
import service from "./services";
import { useSession } from "../../session";
import { useQuery, QueryObserver } from "../../query";

// --- utils
import { useFeedback } from "../../feedback";
import { find, isNil, filter, includes, isString } from "lodash-es";

// --- types
import type { Address } from "./types";
import type { PaginatedParams } from "../../query";
import type { QueryCacheNotifyEvent } from "@tanstack/query-core";

let addressObserver: QueryObserver | undefined;

/**
 * Subscribe to the client address query that are present in the cache.
 * This will trigger the callback function when the query is ready/updated.
 * @param callback The callback function to be called when the query is ready/updated.
 * @returns The unsubscribe function
 */
const subscribeToClientAddresses = ({
  callback,
}: {
  callback: (data: QueryCacheNotifyEvent) => void;
}) => {
  if (!addressObserver) {
    addressObserver = new QueryObserver({ queryKey: service.queryKey });
  }

  return addressObserver.subscribe(data => {
    if (
      data.query.state.fetchStatus === "idle" &&
      data.query.state.status === "success"
    ) {
      callback(data);
    }
  });
};

export const useClientAddresses = () => {
  const { addError, addSuccess } = useFeedback();

  /**
   * Check if the client addresses are loaded and ready.
   * @returns A promise that resolves to true when the addresses are ready.
   * @example isReady().then(() => console.log("Addresses are ready!"))
   */
  function isReady() {
    return new Promise<boolean>(async (resolve, reject) => {
      const { queryClient } = useQuery();
      const { isAuthenticated } = useSession();

      const cache = queryClient.getQueryCache().find({
        queryKey: service.queryKey,
      });

      if (!isNil(cache)) resolve(true);

      isAuthenticated()
        .then(() => {
          const unsubscribe = subscribeToClientAddresses({
            callback: () => {
              resolve(true);
              unsubscribe();
            },
          });
        })
        .catch(error => reject(error));
    });
  }

  /**
   * Get all the addresses for the current client.
   * @param allowStale Whether to allow stale data. Defaults to true.
   * @returns An array of parsed addresses if found, otherwise an empty array.
   * @example getAll().then((addresses) => console.log(addresses))
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
   * @param param The filter to match against the address title and description.
   * @returns The address object if found, otherwise undefined.
   * @example findOne("home").then((address) => console.log(address))
   */
  function findOne(param: string) {
    const addresses = getAllFromCache();
    return find(
      addresses,
      item =>
        includes(item.title.toLowerCase(), param.toLowerCase()) ||
        includes(item.description.toLowerCase(), param.toLowerCase())
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
    { allowStale }: { allowStale?: boolean } = {}
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
  };
};
