// --- internal
import service from "./services";
import { useSession } from "../../session";
import { useQuery, QueryObserver } from "../../query";

// --- utils
import { find, isNil, filter, includes } from "lodash-es";

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

export const useClientAddresses = (): UseClientAddresses => {
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

  async function getAll() {
    return service.loadAll();
  }

  function getAllFromCache() {
    return service.loadAllFromCache();
  }

  function getOne(id: Address["id"]) {
    const addresses = getAllFromCache();
    return find(addresses, ["id", id]);
  }

  function findOne(param: string) {
    const addresses = getAllFromCache();
    return find(
      addresses,
      item =>
        includes(item.title.toLowerCase(), param.toLowerCase()) ||
        includes(item.description.toLowerCase(), param.toLowerCase())
    );
  }

  function filterAddresses(param: string) {
    const addresses = getAllFromCache();
    return filter(
      addresses,
      item =>
        includes(item.title.toLowerCase(), param.toLowerCase()) ||
        includes(item.description.toLowerCase(), param.toLowerCase())
    );
  }

  async function getDefault() {
    return getAll().then(items => find(items, "default"));
  }

  return {
    isReady,
    //--- getters
    getOne,
    getAll,
    filter: filterAddresses,
    findOne,
    getPaged: service.loadPaged,
    getDefault,
    getAllFromCache,
  };
};
