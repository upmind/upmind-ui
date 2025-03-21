// --- internal
import services from "./services";
import { useSession } from "../../session";
import { QueryObserver } from "../../query";

// --- utils
import { filter, find, includes } from "lodash-es";

// --- types
import type { QueryCacheNotifyEvent } from "@tanstack/query-core";
import type { Address, UseClientAddresses } from "./types";

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
    addressObserver = new QueryObserver({
      queryKey: services.queryKey,
    });
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

export const useClientAddresses = (): UseClientAddresses => {
  function isReady() {
    return new Promise<boolean>(async (resolve, reject) => {
      const { isAuthenticated } = useSession();

      isAuthenticated()
        .then(() =>
          subscribeToClientAddresses({
            callback: () => resolve(true),
          })
        )
        .catch(error => reject(error));
    });
  }

  async function getAllAddresses() {
    return services.loadAll();
  }

  function getAllAddressesFromCache() {
    return services.loadAllFromCache();
  }

  async function getOneAddress(id: Address["id"]) {
    return getAllAddresses().then(items => find(items, ["id", id]));
  }

  async function findOneAddress(param: string) {
    return getAllAddresses().then(items =>
      find(
        items,
        item =>
          includes(item.title.toLowerCase(), param.toLowerCase()) ||
          includes(item.description.toLowerCase(), param.toLowerCase())
      )
    );
  }

  async function filterAddresses(param: string) {
    return getAllAddresses().then(items =>
      filter(
        items,
        item =>
          includes(item.title.toLowerCase(), param.toLowerCase()) ||
          includes(item.description.toLowerCase(), param.toLowerCase())
      )
    );
  }

  async function getDefaultAddress() {
    return getAllAddresses().then(items => find(items, "default"));
  }

  return {
    isReady,
    //--- getters
    getOne: getOneAddress,
    getAll: getAllAddresses,
    filter: filterAddresses,
    findOne: findOneAddress,
    getPaged: services.loadPaged,
    getDefault: getDefaultAddress,
    getAllFromCache: getAllAddressesFromCache,
  };
};
