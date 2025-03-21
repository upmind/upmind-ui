// --- internal
import service from "./services";
import { useSession } from "../../session";
import { QueryObserver } from "../../query";

// --- utils
import { filter, find, includes } from "lodash-es";

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
      const { isAuthenticated } = useSession();

      isAuthenticated()
        .then(() =>
          subscribeToClientCompanies({
            callback: () => resolve(true),
          })
        )
        .catch(error => reject(error));
    });
  }

  async function getAllCompanies() {
    return service.loadAll();
  }

  function getAllCompaniesFromCache() {
    return service.loadAllFromCache();
  }

  async function getOneCompany(id: Company["id"]) {
    return getAllCompanies().then(item => find(item, ["id", id]));
  }

  async function findOneCompany(param: string) {
    return getAllCompanies().then(items =>
      find(
        items,
        item =>
          includes(item.name.toLowerCase(), param.toLowerCase()) ||
          includes(item.description.toLowerCase(), param.toLowerCase())
      )
    );
  }

  async function filterCompanies(param: string) {
    return getAllCompanies().then(items =>
      filter(
        items,
        item =>
          includes(item.name.toLowerCase(), param.toLowerCase()) ||
          includes(item.description.toLowerCase(), param.toLowerCase())
      )
    );
  }

  async function getDefaultCompany() {
    return getAllCompanies().then(items => find(items, "default"));
  }

  return {
    isReady,
    //--- getters
    getOne: getOneCompany,
    getAll: getAllCompanies,
    filter: filterCompanies,
    findOne: findOneCompany,
    getPaged: service.loadPaged,
    getDefault: getDefaultCompany,
    getAllFromCache: getAllCompaniesFromCache,
  };
};
