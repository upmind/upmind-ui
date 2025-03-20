import type { Address, UseClientAddresses } from "./types";
import { useSession } from "../../session";
import services from "./services";
import { filter, find, includes } from "lodash-es";
import { QueryObserver } from "../../query";
import type { QueryCacheNotifyEvent } from "@tanstack/query-core";

let addressObserver: QueryObserver | undefined;

/**
 * Subscribe to the client address query that are present in the cache.
 * This will trigger the callback function when the query is ready/updated.
 * @param clientId The client id to which the services belong.
 * @param callback The callback function to be called when the query is ready/updated.
 * @returns The unsubscribe function
 */
const subscribeToClientAddresses = ({
  clientId,
  callback,
}: {
  clientId: string;
  callback: (data: QueryCacheNotifyEvent) => void;
}) => {
  if (!addressObserver) {
    addressObserver = new QueryObserver({
      queryKey: ["clients", clientId, "addresses"],
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
      const client = await isAuthenticated().catch(error => reject(error));

      subscribeToClientAddresses({
        clientId: client.id as string,
        callback: () => resolve(true),
      });
    });
  }

  async function getAllAddresses() {
    return services.loadAll();
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
  };
};
