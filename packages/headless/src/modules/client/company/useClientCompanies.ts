// --- internal
import service from "./services";
import { useSession } from "../../session";
import { QueryObserver, useQuery } from "../../query";

// --- utils
import { useFeedback } from "../../feedback";
import { filter, find, includes, isNil, isString } from "lodash-es";

// --- types
import type { Company } from "./types";
import type { PaginatedParams } from "../../query";
import type { QueryCacheNotifyEvent } from "@tanstack/query-core";

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

export const useClientCompanies = () => {
  const { addError, addSuccess } = useFeedback();

  /**
   * Check if the client companies are loaded and ready
   * @returns A promise that resolves to a true when the companies are ready
   * @example isReady().then(() => console.log("Companies are ready!"))
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

  /**
   * Get all the companies for the current client.
   * @returns A promise that resolves to an array of companies
   * @example getAll().then(companies => console.log(companies))
   */
  async function getAll({ allowStale = true } = {}) {
    return service.loadAll({ allowStale });
  }

  /**
   * Get all the companies for the current client from the cache.
   * @returns An array of companies
   * @example getAllFromCache().then(companies => console.log(companies))
   * @throws {@link CacheIsStaleError} when the cache is stale
   */
  function getAllFromCache() {
    return service.loadAllFromCache();
  }

  /**
   * Get a company by its id
   * @param id The id of the company to get
   * @returns The company if found or undefined.
   * @example getOne("123").then(company => console.log(company))
   */
  function getOne(id: Company["id"]) {
    const companies = getAllFromCache();
    return find(companies, ["id", id]);
  }

  /**
   * Find a single company by a search parameter. The search is case-insensitive and is matched against the company title and description.
   * @param param The search parameter to match against the company title and description.
   * @returns The company if found or undefined.
   * @example findOne("home").then(company => console.log(company))
   */
  function findOne(param: string) {
    const companies = getAllFromCache();
    return find(
      companies,
      item =>
        includes(item.name.toLowerCase(), param.toLowerCase()) ||
        includes(item.description.toLowerCase(), param.toLowerCase())
    );
  }

  /**
   * Get a paginated list of companies for the current client.
   * @param paginationParams The pagination parameters to use for the request.
   * @param allowStale Whether to allow stale data. Defaults to true.
   * @returns A promise that resolves to a paginated list of companies.
   * @example getPaged({ page: 1, pageSize: 10 }).then(companies => console.log(companies))
   */
  async function getPaged(
    paginationParams: PaginatedParams,
    { allowStale = true } = {}
  ) {
    return service.loadPaged(paginationParams, { allowStale });
  }

  /**
   * Find a single company by a search parameter. The search is case-insensitive and is matched against the company title and description.
   * @param param The search parameter to match against the company title and description
   * @returns The company if found or undefined.
   * @example findOne("home").then(companies => console.log(companies))
   */
  function filterCompanies(param: string) {
    const companies = getAllFromCache();
    return filter(
      companies,
      item =>
        includes(item.name.toLowerCase(), param.toLowerCase()) ||
        includes(item.description.toLowerCase(), param.toLowerCase())
    );
  }

  /**
   * Get the default company for the current client.
   * @returns A promise that resolves to the default company if found or undefined.
   * @example getDefault().then(company => console.log(company))
   */
  async function getDefault() {
    return getAll().then(items => find(items, "meta.isDefault"));
  }

  async function remove(id: Company["id"]) {
    return service
      .remove(id)
      .then(() => addSuccess("Successfully removed company"))
      .then(service.refresh)
      .catch(error =>
        addError({
          title: isString(error)
            ? error
            : error?.title || "We experienced an error removing this company",
          copy: error?.message,
          data: error?.data,
        })
      );
  }

  async function setDefault(id: Company["id"]) {
    return service
      .setDefault(id)
      .then(() => addSuccess("Successfully set company as default"))
      .then(service.refresh)
      .catch(error =>
        addError({
          title: isString(error)
            ? error
            : error?.title ||
              "We experienced an error setting this company as default",
          copy: error?.message,
          data: error?.data,
        })
      );
  }

  return {
    isReady,
    getOne,
    getAll,
    filter: filterCompanies,
    findOne,
    getPaged,
    getDefault,
    getAllFromCache,
    remove,
    setDefault,
  };
};
