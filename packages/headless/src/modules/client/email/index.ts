// --- external

// --- internal
import emails from "./services";
import { useSession } from "../../session";

// --- utils
import { QueryObserver } from "../../query";
import { find, filter, isEqual } from "lodash-es";

// --- types
import { IEmail } from "@upmind-automation/types";
import { UseClientEmails } from "./types";
import { QueryCacheNotifyEvent } from "@tanstack/query-core";

// -----------------------------------------------------------------------------

let emailObserver: QueryObserver | undefined;

/**
 * Subscribe to the client address query that are present in the cache.
 * This will trigger the callback function when the query is ready/updated.
 * @param clientId The client id to which the addresses belong.
 * @param callback The callback function to be called when the query is ready/updated.
 * @returns The unsubscribe function
 */
const subscribeToClientEmail = ({
  clientId,
  callback,
}: {
  clientId: string;
  callback: (data: QueryCacheNotifyEvent) => void;
}) => {
  if (!emailObserver) {
    emailObserver = new QueryObserver({
      queryKey: ["clients", clientId, "emails"],
    });
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

// -----------------------------------------------------------------------------

export const useClientEmails = (): UseClientEmails => {
  async function isReady() {
    return new Promise<boolean>(async (resolve, reject) => {
      const { isAuthenticated } = useSession();
      const client = await isAuthenticated().catch(error => reject(error));

      subscribeToClientEmail({
        clientId: client.id as string,
        callback: () => resolve(true),
      });
    });
  }

  async function getAllEmails() {
    return emails.loadAll();
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
    getPaged: emails.loadPaged,
    getDefault: getDefaultEmail,
    // --- actions
    add: emails.add,
    update: emails.update,
    remove: emails.remove,
    setDefault: emails.setDefault,
  };
};
