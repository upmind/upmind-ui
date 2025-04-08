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
import type { Phone } from "./types";
import type { PaginatedParams } from "../../query";
import type { QueryCacheNotifyEvent } from "@tanstack/query-core";

let observer: QueryObserver | undefined;

/**
 * Subscribe to the client address query that are present in the cache.
 * This will trigger the callback function when the query is ready/updated.
 * @param callback The callback function to be called when the query is ready/updated.
 * @returns The unsubscribe function
 */
const subscribe = (
  callback: (query: QueryCacheNotifyEvent["query"]) => void
): QueryObserver => {
  if (!observer) {
    observer = useQuerySubscription(service.queryKey, callback);
  }
  return observer;
};

export const useClientPhones = () => {
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
   * Get all the phones for the current client.
   * @param allowStale Whether to allow stale data. Defaults to true.
   * @returns A promise that resolves to an array of phones
   * @example getAll().then(phones => console.log(phones))
   */
  async function getAll({ allowStale = true } = {}) {
    return service.loadAll({ allowStale });
  }

  /**
   * Get all phones for the current client from the cache
   * @returns An array of phones
   * @example getAllFromCache().then(phones => console.log(phones))
   * @see {@link Phone} for the phone details
   * @throws {@link CacheIsStaleError} when the cache is stale
   */
  function getAllFromCache() {
    return service.loadAllFromCache();
  }

  /**
   * Get a phone by its id
   * @param id The id of the phone to get
   * @returns The phone if found or undefined.
   * @example getOne("123").then(phone => console.log(phone))
   */
  function getOne(id: Phone["id"]) {
    const phones = getAllFromCache();
    return find(phones, ["id", id]);
  }

  /**
   * Find a phone by a search parameter
   * @param param The search parameter to use
   * @returns The phone if found or undefined.
   * @example findOne("123").then(phone => console.log(phone))
   */
  function findOne(param: string) {
    const phones = getAllFromCache();
    return find(
      phones,
      item =>
        includes(item.title.toLowerCase(), param.toLowerCase()) ||
        includes(item.description?.toLowerCase(), param.toLowerCase())
    );
  }

  /**
   * Get phones in a paged format.
   * @param paginationParams The pagination parameters to use.
   * @param allowStale Whether to allow stale data. Defaults to true.
   * @returns A promise that resolves to an array of phones
   * @example getPaged({ page: 1, limit: 10 }).then(phones => console.log(phones))
   */
  async function getPaged(
    paginationParams: PaginatedParams,
    { allowStale = true } = {}
  ) {
    return service.loadPaged(paginationParams, { allowStale });
  }

  /**
   * Filter phones by a search parameter
   * @param param The search parameter to use
   * @returns An array of phones that match the search parameter
   * @example filter("personal").then(phones => console.log(phones))
   */
  function filterPhones(param: string) {
    const phones = getAllFromCache();
    return filter(
      phones,
      item =>
        includes(item.title.toLowerCase(), param.toLowerCase()) ||
        (item.description &&
          includes(item?.description.toLowerCase(), param.toLowerCase())) ||
        includes(item.phone.country.toUpperCase(), param.toUpperCase())
    );
  }

  /**
   * Get the default phone for the current client.
   * @returns A promise that resolves to the default phone if found or undefined.
   * @example getDefault().then(phone => console.log(phone))
   */
  async function getDefault() {
    return getAll().then(items => find(items, "meta.isDefault"));
  }

  /**
   * Remove a phone by id.
   * @param id The id of the phone to remove.
   * @returns A promise that resolves when the phone is removed.
   * @example remove("123").then(() => console.log("Phone removed"))
   */
  async function remove(id: Phone["id"]) {
    return service
      .remove(id)
      .then(() => addSuccess("Successfully removed phone"))
      .then(service.refresh)
      .catch(error =>
        addError({
          title: isString(error)
            ? error
            : error?.title || "We experienced an error removing this phone",
          copy: error?.message,
          data: error?.data,
        })
      );
  }

  /**
   * Set a phone as default.
   * @param id The id of the phone to set as default.
   * @returns A promise that resolves when the phone is set as default.
   * @example setDefault("123").then(() => console.log("Phone set as default"))
   */
  async function setDefault(id: Phone["id"]) {
    return service
      .setDefault(id)
      .then(() => addSuccess("Successfully set phone as default"))
      .then(service.refresh)
      .catch(error => {
        addError({
          title: isString(error)
            ? error
            : error?.title ||
              "We experienced an error setting this phone as default",
          copy: error?.message,
          data: error?.data,
        });
      });
  }

  return {
    queryOptions: {
      queryKey: service.queryKey,
      queryFn: () => getAll(),
      staleTime: useTime().DAY,
    },
    subscribe,
    isReady,
    getOne,
    getAll,
    filter: filterPhones,
    findOne,
    getPaged,
    getDefault,
    getAllFromCache,
    remove,
    setDefault,
    invalidate: invalidateQueryByKey(service.queryKey),
  };
};
