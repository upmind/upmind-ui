// --- internal
import service from "./services";
import { useSession } from "../../session";
import { QueryObserver, useQuery } from "../../query";

// --- utils
import { find, filter, isEqual, isNil } from "lodash-es";

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

  async function getAll() {
    return service.loadAll();
  }

  function getAllFromCache() {
    return service.loadAllFromCache();
  }

  function getOne(id: IEmail["id"]) {
    const emails = getAllFromCache();
    return find(emails, ["id", id]);
  }

  function findOne(param: string) {
    const emails = getAllFromCache();
    return find(
      emails,
      item => isEqual(item.id, param) || isEqual(item.email, param)
    );
  }

  function filterEmails(param: string) {
    const emails = getAllFromCache();
    return filter(
      emails,
      item => isEqual(item.id, param) || isEqual(item.email, param)
    );
  }

  async function getDefault() {
    return getAll().then(items => find(items, "default"));
  }

  return {
    isReady,
    // --- getters
    getOne,
    getAll,
    filter: filterEmails,
    findOne,
    getPaged: service.loadPaged,
    getDefault,
    getAllFromCache,
  };
};
