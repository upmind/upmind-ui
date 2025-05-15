// --- internal
import {
  QueryObserver,
  invalidateQueryByKey,
  useQuerySubscription,
} from "../../query";
import service from "./services";
import { useTime } from "../../../utils";
import { useSession } from "../../session";
import { useFeedback } from "../../feedback";

// --- utils
import { find, filter, includes, isString } from "lodash-es";

// --- types
import type { Company } from "./types";
import type { PaginatedParams } from "../../query";
import type { QueryCacheNotifyEvent } from "@tanstack/query-core";

let observer: QueryObserver | undefined;

/**
 * Subscribe to the client companies query that are present in the cache.
 * This will trigger the callback function when the query is ready/updated.
 * @param callback The callback function to be called when the query is ready/updated.
 * @returns The unsubscribe function
 */
const subscribe = ({
  callback,
}: {
  callback: (query: QueryCacheNotifyEvent["query"]) => void;
}) => {
  if (!observer) {
    observer = useQuerySubscription(service.queryKey, callback);
  }
  return observer;
};

export const useClientCompanies = () => {
  const { addError, addSuccess } = useFeedback();
  const { isAuthenticated } = useSession();

  /**
   * Check if the client addresses are loaded and ready.
   * @returns A promise that resolves to true when the addresses are ready to be fetched.
   * @example isReady().then(getAll).then(() => console.log("Addresses are ready!"))
   */
  async function isReady(): Promise<void> {
    return isAuthenticated();
  }

  /**
   * Get all the companies for the current client.
   * @param allowStale Whether to allow stale data. Defaults to true.
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

  /**
   * Remove a company by id.
   * @param id The id of the company to remove.
   * @returns A promise that resolves when the company is removed.
   * @example remove("123").then(() => console.log("Company removed"))
   */
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

  /**
   * Set a company as default.
   * @param id The id of the company to set as default.
   * @returns A promise that resolves when the company is set as default.
   * @example setDefault("123").then(() => console.log("Company set as default"))
   */
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
    queryOptions: {
      queryKey: service.queryKey,
      queryFn: getAll,
      staleTime: useTime().DAY,
    },
    subscribe,
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
    invalidate: invalidateQueryByKey(service.queryKey),
  };
};
