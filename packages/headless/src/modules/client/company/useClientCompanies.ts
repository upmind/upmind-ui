// --- internal
import service from "./services";
import { useSession } from "../../session";
import { QueryObserver, useQuery } from "../../query";

// --- utils
import { filter, find, includes, isNil } from "lodash-es";

// --- types
import type { QueryCacheNotifyEvent } from "@tanstack/query-core";
import type { Company, UseClientCompanies } from "./types";

let companyObserver: QueryObserver | undefined;

/**
 * Subscribe to the client companies query that are present in the cache.
 * This will trigger the callback function when the query is ready/updated.
 * @param callback The callback function to be called when the query is ready/updated.
 * @returns The unsubscribe function
 */
const subscribeToClientCompanies = ({
  callback,
}: {
  callback: (data: QueryCacheNotifyEvent) => void;
}) => {
  if (!companyObserver) {
    companyObserver = new QueryObserver({ queryKey: service.queryKey });
  }

  return companyObserver.subscribe(data => {
    if (
      data.query.state.fetchStatus === "idle" &&
      data.query.state.status === "success"
    ) {
      callback(data);
    }
  });
};

export const useClientCompanies = (): UseClientCompanies => {
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
          const unsubscribe = subscribeToClientCompanies({
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

  function getOne(id: Company["id"]) {
    const companies = getAllFromCache();
    return find(companies, ["id", id]);
  }

  function findOne(param: string) {
    const companies = getAllFromCache();
    return find(
      companies,
      item =>
        includes(item.name.toLowerCase(), param.toLowerCase()) ||
        includes(item.description.toLowerCase(), param.toLowerCase())
    );
  }

  function filterCompanies(param: string) {
    const companies = getAllFromCache();
    return filter(
      companies,
      item =>
        includes(item.name.toLowerCase(), param.toLowerCase()) ||
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
    filter: filterCompanies,
    findOne,
    getPaged: service.loadPaged,
    getDefault,
    getAllFromCache,
  };
};
