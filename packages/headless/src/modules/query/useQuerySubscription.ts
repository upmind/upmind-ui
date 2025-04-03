// --- external
import { isFunction } from "xstate/lib/utils";
import { getQueryClient } from "./utils";

// --- internal
import { QueryObserver } from "./queryObserver";

// --- types
import { QueryKey, type QueryCacheNotifyEvent } from "@tanstack/query-core";
type QuerySubscriptionFilter = (event: QueryCacheNotifyEvent) => boolean;
export type { QueryCacheNotifyEvent, QuerySubscriptionFilter };

// -----------------------------------------------------------------------------

/**
 * Query Subscription - this is used by the other machines to listen for changes/messages from the query service
 * based on the query key. This allows stale data to be updated in the machine automatically
 * @param callback
 * @returns
 */
export function useQueryHelper(callback: any, onReceive: any) {
  // We allow machines to provide us with a filter to only listen to specific events
  // this is useful in preventing unnecessary updates to the machine
  let queryKey: QueryKey | undefined = undefined;

  onReceive((event: any) => {
    switch (event.type) {
      case "QUERY_KEY":
        queryKey = event.queryKey;
        break;
      default:
        break;
    }
  });

  let observer: QueryObserver | undefined;

  if (queryKey) observer = useQuerySubscription(queryKey, callback);

  return () => {
    // The subscriber has unsubscribed from this service
    // typically when the transitioning out of the state node
    // we dont need to do anything here as we are consuming a global service
    // console.debug('clientStore', 'checkClient', 'unsubscribed');
    if (observer) observer.unsubscribe();
  };
}

/**
 * Subscribe to the client address query that are present in the cache.
 * This will trigger the callback function when the query is ready/updated.
 * @param callback The callback function to be called when the query is ready/updated.
 * @returns The unsubscribe function
 */
export const useQuerySubscription = (
  queryKey: QueryKey,
  callback: (query: QueryCacheNotifyEvent["query"]) => void
): QueryObserver => {
  const observer = new QueryObserver(queryKey);
  observer.subscribe(query => callback(query));
  return observer;
};
