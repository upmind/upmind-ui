// --- internal
import service from "./services";
import { useSession } from "../../session";
import { useFeedback } from "../../feedback";
import { useQuery, QueryObserver } from "../../query";

// --- utils
import { find, filter, isEqual, isNil, isString } from "lodash-es";

// --- types
import type { Email } from "./types";
import type { IEmail } from "@upmind-automation/types";
import type { PaginatedParams } from "../../query";
import type { QueryCacheNotifyEvent } from "@tanstack/query-core";

let emailObserver: QueryObserver | undefined;

/**
 * Subscribe to the client email query that are present in the cache.
 * This will trigger the callback function when the query is ready/updated.
 * @param callback The callback function to be called when the query is ready/updated.
 * @returns The unsubscribe function
 */
const subscribeToClientEmail = ({
  callback,
}: {
  callback: (data: QueryCacheNotifyEvent) => void;
}) => {
  if (!emailObserver) {
    emailObserver = new QueryObserver({ queryKey: service.queryKey });
  }

  return emailObserver.subscribe(data => {
    if (
      data.query.state.fetchStatus === "idle" &&
      data.query.state.status === "success"
    ) {
      callback(data);
    }
  });
};

export const useClientEmails = () => {
  const { addError, addSuccess } = useFeedback();

  /**
   * Check if the client emails query is ready.
   * @returns A promise that resolves to a boolean.
   * @example isReady().then((ready) => console.log("Emails are ready!", ready))
   */
  async function isReady() {
    return new Promise<boolean>(async (resolve, reject) => {
      const { queryClient } = useQuery();
      const { isAuthenticated } = useSession();

      const cache = queryClient.getQueryCache().find({
        queryKey: service.queryKey,
      });

      if (!isNil(cache)) resolve(true);

      isAuthenticated()
        .then(() => {
          const unsubscribe = subscribeToClientEmail({
            callback: () => {
              unsubscribe();
              resolve(true);
            },
          });
        })
        .catch(error => reject(error));
    });
  }

  /**
   * Get all the emails for the client.
   * @returns A promise that resolves to an array of emails.
   * @example getAll().then((emails) => console.log(emails))
   */
  async function getAll() {
    return service.loadAll();
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
  function getOne(id: IEmail["id"]) {
    const emails = getAllFromCache();
    return find(emails, ["id", id]);
  }

  /**
   * Find a single email based on the given param. The param is matched against the id and email.
   * @param param The filter to match against the email id and email.
   * @returns A promise that resolves to an email or undefined.
   * @example findOne("123").then((email) => console.log(email))
   */
  function findOne(param: string) {
    const emails = getAllFromCache();
    return find(
      emails,
      item => isEqual(item.id, param) || isEqual(item.email, param)
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
    { allowStale }: { allowStale?: boolean } = {}
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
  };
};
