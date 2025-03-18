// --- external

// --- internal
import phones from "./services";
import { useSession } from "../../session";
import { QueryObserver } from "../../query";

// --- utils
import { find, filter, includes } from "lodash-es";

// --- types
import type { Phone } from "./types";
import type { QueryCacheNotifyEvent } from "@tanstack/query-core";

// -----------------------------------------------------------------------------

let phonesObserver: QueryObserver | undefined;

const subscribeToClientPhones = ({
  clientId,
  callback,
}: {
  clientId: string;
  callback: (data: QueryCacheNotifyEvent) => void;
}) => {
  if (!phonesObserver) {
    phonesObserver = new QueryObserver({
      queryKey: ["clients", clientId, "phones"],
    });
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

export const useClientPhones = () => {
  function isReady() {
    return new Promise<boolean>(async (resolve, reject) => {
      const { isAuthenticated } = useSession();
      const client = await isAuthenticated().catch(error => reject(error));

      subscribeToClientPhones({
        clientId: client.id as string,
        callback: () => resolve(true),
      });
    });
  }

  async function getAllPhones() {
    return phones.loadAll();
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
          (item.description &&
            includes(item?.description.toLowerCase(), param.toLowerCase()))
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
    getPaged: phones.loadPaged,
    getDefault: getDefaultPhone,
    //--- actions
    add: phones.add,
    update: phones.update,
    remove: phones.remove,
    setDefault: phones.setDefault,
  };
};
