// --- internal
import service from "./services";
import { useSession } from "../../session";
import { QueryObserver } from "../../query";

// --- utils
import { find, filter, isEqual } from "lodash-es";

// --- types
import type { IEmail } from "@upmind-automation/types";
import type { UseClientEmails } from "./types";
import type { QueryCacheNotifyEvent } from "@tanstack/query-core";

let emailObserver: QueryObserver | undefined;

/**
 * Subscribe to the client address query that are present in the cache.
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

export const useClientEmails = (): UseClientEmails => {
  async function isReady() {
    return new Promise<boolean>(async (resolve, reject) => {
      const { isAuthenticated } = useSession();

      isAuthenticated()
        .then(() =>
          subscribeToClientEmail({
            callback: () => resolve(true),
          })
        )
        .catch(error => reject(error));
    });
  }

  async function getAllEmails() {
    return service.loadAll();
  }

  function getAllEmailFromCache() {
    return service.loadAllFromCache();
  }

  async function getOneEmail(id: IEmail["id"]) {
    return getAllEmails().then(items => find(items, ["id", id]));
  }

  async function findOneEmail(param: string) {
    return getAllEmails().then(items =>
      find(items, item => isEqual(item.id, param) || isEqual(item.email, param))
    );
  }

  async function filterEmails(param: string) {
    return getAllEmails().then(items =>
      filter(
        items,
        item => isEqual(item.id, param) || isEqual(item.email, param)
      )
    );
  }

  async function getDefaultEmail() {
    return getAllEmails().then(items => find(items, "default"));
  }

  return {
    isReady,
    // --- getters
    getOne: getOneEmail,
    getAll: getAllEmails,
    filter: filterEmails,
    findOne: findOneEmail,
    getPaged: service.loadPaged,
    getDefault: getDefaultEmail,
    getAllFromCache: getAllEmailFromCache,
  };
};
