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
import {
  find,
  filter,
  isEqual,
  isString,
  includes,
  every,
  get,
} from "lodash-es";

// --- types
import type { Email } from "./types";
import type { PaginatedParams } from "../../query";
import type { QueryCacheNotifyEvent } from "@tanstack/query-core";

let observer: QueryObserver | undefined;

/**
 * Subscribe to the client email query that are present in the cache.
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

export const useClientEmails = () => {
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
   * Get all the emails for the current client.
   * @param allowStale Whether to allow stale data. Defaults to true.
   * @returns A promise that resolves to an array of emails.
   * @example getAll().then((emails) => console.log(emails))
   */
  async function getAll({ allowStale = true } = {}) {
    return service.loadAll({ allowStale });
  }

  /**
   * Get all the emails for the client from the cache.
   * @returns A promise that resolves to an array of emails.
   * @example getAllFromCache().then((emails) => console.log(emails))
   * @see {@link Email} for the email details.
   * @throws {@link CacheIsStaleError} when the cache is stale.
   */
  function getAllFromCache() {
    return service.loadAllFromCache();
  }

  /**
   * Get a single email by id.
   * @param id The id of the email to get.
   * @returns A promise that resolves to an email or undefined.
   * @example getOne("123").then((email) => console.log(email))
   */
  function getOne(id: Email["id"]) {
    const emails = getAllFromCache();
    return find(emails, ["id", id]);
  }

  /**
   * Find a single email based on the given param. The param is matched against the id and email.
   * @param mapping The filter to match against the email id and email.
   * @returns A promise that resolves to an email or undefined.
   * @example findOne("123").then((email) => console.log(email))
   */
  function findOne(mapping: string | Partial<Email>) {
    const emails = getAllFromCache();
    if (isString(mapping)) {
      return find(emails, item =>
        includes(item.email.toLowerCase(), mapping.toLowerCase())
      );
    }

    return find(emails, item =>
      every(mapping, (value, key) => {
        if (key == "id") {
          return item.id == value;
        } else {
          const modelValue = get(item, key);
          return modelValue == value;
        }
      })
    );
  }

  /**
   * Get emails in a paged format.
   * @param paginationParams The pagination parameters to use.
   * @param allowStale Whether to allow stale data. Defaults to true.
   * @returns A promise that resolves to an object containing the emails and pagination details.
   * @example getPaged({ limit: 10, offset: 0 }) // returns the first 10 emails if 10 emails are available
   */
  async function getPaged(
    paginationParams: PaginatedParams,
    { allowStale = true } = {}
  ) {
    return service.loadPaged(paginationParams, { allowStale });
  }

  /**
   * Filter the emails by id or email.
   * @param param The id or email to filter by.
   * @returns A promise that resolves to an array of emails.
   * @example filter("123").then((emails) => console.log(emails))
   */
  function filterEmails(param: string) {
    const emails = getAllFromCache();
    return filter(
      emails,
      item => isEqual(item.id, param) || isEqual(item.email, param)
    );
  }

  /**
   * Get the default email for the client.
   * @returns A promise that resolves to an email or undefined.
   * @example getDefault().then((email) => console.log(email))
   */
  async function getDefault() {
    return getAll().then(items => find(items, "meta.isDefault"));
  }

  /**
   * Remove an email by id.
   * @param id The id of the email to remove.
   * @returns A promise that resolves to the removed email.
   * @example remove("123").then((email) => console.log(email))
   */
  async function remove(id: Email["id"]) {
    return service
      .remove(id)
      .then(() => addSuccess("Successfully removed email"))
      .then(service.refresh)
      .catch(error =>
        addError({
          title: isString(error)
            ? error
            : error?.title || "We experienced an error removing this email",
          copy: error?.message,
          data: error?.data,
        })
      );
  }

  /**
   * Set an email as default.
   * @param id The id of the email to set as default.
   * @returns A promise that resolves to the updated email.
   * @example setDefault("123").then((email) => console.log(email))
   */
  async function setDefault(id: Email["id"]) {
    return service
      .setDefault(id)
      .then(() => addSuccess("Successfully set email as default"))
      .then(service.refresh)
      .catch(error => {
        addError({
          title: isString(error)
            ? error
            : error?.title ||
              "We experienced an error setting this email as default",
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
    filter: filterEmails,
    findOne,
    getPaged,
    getDefault,
    getAllFromCache,
    remove,
    setDefault,
    invalidate: invalidateQueryByKey(service.queryKey),
  };
};
