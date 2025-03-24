// --- internal
import service from "./services";
import { useSession } from "../../session";
import { QueryObserver } from "../../query";

// --- utils
import { find, filter, includes } from "lodash-es";

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
      const { isAuthenticated } = useSession();

      isAuthenticated()
        .then(() => {
          subscribeToClientPhones({
            callback: () => resolve(true),
          });
        })
        .catch(error => reject(error));
    });
  }

  async function getAllPhones() {
    return service.loadAll();
  }

  function getAllPhonesFromCache() {
    return service.loadAllFromCache();
  }

  async function getOnePhone(id: Phone["id"]) {
    return getAllPhones().then(phones => find(phones, ["id", id]));
  }

  async function findOnePhone(param: string) {
    return getAllPhones().then(items =>
      find(
        items,
        item =>
          includes(item.title.toLowerCase(), param.toLowerCase()) ||
          includes(item.description?.toLowerCase(), param.toLowerCase())
      )
    );
  }

  async function filterPhones(param: string) {
    return getAllPhones().then(items =>
      filter(
        items,
        item =>
          includes(item.title.toLowerCase(), param.toLowerCase()) ||
          (item.description &&
            includes(item?.description.toLowerCase(), param.toLowerCase())) ||
          includes(item.country.toUpperCase(), param.toUpperCase())
      )
    );
  }

  async function getDefaultPhone() {
    return getAllPhones().then(items => find(items, "default"));
  }

  return {
    isReady,
    //--- getters
    getOne: getOnePhone,
    getAll: getAllPhones,
    filter: filterPhones,
    findOne: findOnePhone,
    getPaged: service.loadPaged,
    getDefault: getDefaultPhone,
    getAllFromCache: getAllPhonesFromCache,
  };
};
