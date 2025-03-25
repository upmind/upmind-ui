// --- internal
import service from "./services";
import { useSession } from "../../session";
import { QueryObserver, useQuery } from "../../query";

// --- utils
import { find, filter, includes, isNil } from "lodash-es";

// --- types
import type { QueryCacheNotifyEvent } from "@tanstack/query-core";
import type { Phone, UseClientPhones } from "./types";

// -----------------------------------------------------------------------------

let phonesObserver: QueryObserver | undefined;

const subscribeToClientPhones = ({
  callback,
}: {
  callback: (data: QueryCacheNotifyEvent) => void;
}) => {
  if (!phonesObserver) {
    phonesObserver = new QueryObserver({ queryKey: service.queryKey });
  }

  return phonesObserver.subscribe(data => {
    if (
      data.query.state.fetchStatus === "idle" &&
      data.query.state.status === "success"
    ) {
      callback(data);
    }
  });
};

// -----------------------------------------------------------------------------

export const useClientPhones = (): UseClientPhones => {
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
          const unsubscribe = subscribeToClientPhones({
            callback: () => {
              unsubscribe();
              resolve(true);
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

  function getOne(id: Phone["id"]) {
    const phones = getAllFromCache();
    return find(phones, ["id", id]);
  }

  function findOne(param: string) {
    const phones = getAllFromCache();
    return find(
      phones,
      item =>
        includes(item.title.toLowerCase(), param.toLowerCase()) ||
        includes(item.description?.toLowerCase(), param.toLowerCase())
    );
  }

  function filterPhones(param: string) {
    const phones = getAllFromCache();
    return filter(
      phones,
      item =>
        includes(item.title.toLowerCase(), param.toLowerCase()) ||
        (item.description &&
          includes(item?.description.toLowerCase(), param.toLowerCase())) ||
        includes(item.country.toUpperCase(), param.toUpperCase())
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
    filter: filterPhones,
    findOne,
    getPaged: service.loadPaged,
    getDefault,
    getAllFromCache,
  };
};
