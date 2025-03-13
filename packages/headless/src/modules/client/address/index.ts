// --- external

// --- internal
import addresses from "./services";
import { useSession } from "../../session";
import { QueryObserver } from "../../query";

// --- utils
import { find, filter, includes } from "lodash-es";

// --- types
import type { QueryCacheNotifyEvent } from "@tanstack/query-core";
import { UseClientAddresses } from "./types";
import { IAddress } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

let clientObserver: QueryObserver | undefined;

/**
 * Subscribe to the client address query that are present in the cache.
 * This will trigger the callback function when the query is ready/updated.
 * @param clientId The client id to which the addresses belong.
 * @param callback The callback function to be called when the query is ready/updated.
 * @returns The unsubscribe function
 */
const subscribeToClientAddress = ({
  clientId,
  callback,
}: {
  clientId: string;
  callback: (data: QueryCacheNotifyEvent) => void;
}) => {
  if (!clientObserver) {
    clientObserver = new QueryObserver({
      queryKey: ["client", clientId, "addresses"],
    });
  }

  return clientObserver.subscribe(data => {
    if (
      data.query.state.fetchStatus === "idle" &&
      data.query.state.status === "success"
    ) {
      callback(data);
    }
  });
};

// -----------------------------------------------------------------------------

export const useClientAddresses = (): UseClientAddresses => {
  function isReady() {
    return new Promise<boolean>(async (resolve, reject) => {
      const { isAuthenticated } = useSession();
      const client = await isAuthenticated().catch(error => reject(error));

      subscribeToClientAddress({
        clientId: client.id as string,
        callback: () => resolve(true),
      });
    });
  }

  async function getOneAddress(id: IAddress["id"]) {
    return addresses.loadAll().then(items => find(items, ["id", id]));
  }

  async function filterAddresses(param: string) {
    return addresses
      .loadAll()
      .then(items =>
        filter(
          items,
          item =>
            includes(item.title.toLowerCase(), param.toLowerCase()) ||
            includes(item.description.toLowerCase(), param.toLowerCase())
        )
      );
  }

  async function findOneAddress(param: string) {
    return addresses
      .loadAll()
      .then(items =>
        find(
          items,
          item =>
            includes(item.title.toLowerCase(), param.toLowerCase()) ||
            includes(item.description.toLowerCase(), param.toLowerCase())
        )
      );
  }

  async function getDefaultAddress() {
    return addresses.loadAll().then(items => find(items, "default"));
  }

  return {
    isReady,
    getOne: getOneAddress,
    filter: filterAddresses,
    findOne: findOneAddress,
    getDefault: getDefaultAddress,
    //---
    add: addresses.add,
    getAll: addresses.loadAll,
    update: addresses.update,
    remove: addresses.remove,
    getPaged: addresses.loadPaged,
    setDefault: addresses.setDefault,
  };
};
