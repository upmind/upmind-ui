// --- external
import { isFunction } from "xstate/lib/utils";
import { useQueryClient } from "@tanstack/vue-query";

// --- internal

// --- utils
import { every, includes, some } from "lodash-es";

// --- types
import {
  QueryKey,
  type QueryCacheNotifyEvent,
  type QueryFilters,
} from "@tanstack/query-core";
type QuerySubscriptionFilter = (event: QueryCacheNotifyEvent) => boolean;
export type { QueryCacheNotifyEvent, QuerySubscriptionFilter };

// -----------------------------------------------------------------------------

export class QueryObserver {
  queryKey: QueryKey;
  options?: Omit<QueryFilters, "queryKey">;
  queryClient = useQueryClient();
  private subscription: (() => void) | undefined;

  constructor(
    queryKey: QueryKey,
    options: Omit<QueryFilters, "queryKey"> = { exact: true }
  ) {
    this.queryKey = queryKey;
    this.options = options ?? {};
  }

  subscribe(callback: (query: QueryCacheNotifyEvent["query"]) => void) {
    const queryCache = this.queryClient.getQueryCache();

    // set up the query cache
    const query = queryCache.find({
      queryKey: this.queryKey,
      exact: this.options?.exact,
    });
    if (query) {
      callback(query);
    }

    // set up the subscription to watch for changes to the query cache
    this.subscription = queryCache.subscribe((event: QueryCacheNotifyEvent) => {
      if (!event) return;

      const fn = this.options?.exact ? every : some;
      if (fn(this.queryKey, key => includes(event.query.queryKey, key))) {
        callback(event.query);
      }
    });

    return this.subscription;
  }

  unsubscribe() {
    if (this.subscription) {
      this.subscription();
    }
  }
}

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
      case "SET.QUERY_KEY":
        queryKey = event.data;
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
 * @param queryKey The query key to subscribe to.
 * @param callback The callback function to be called when the query is ready/updated.
 * @param options The options to pass to the query observer, such as `exact` to match the query key exactly.
 * @returns The unsubscribe function
 */
export const useQuerySubscription = (
  queryKey: QueryKey,
  callback: (query: QueryCacheNotifyEvent["query"]) => void,
  options: Omit<QueryFilters, "queryKey"> = { exact: true }
): QueryObserver => {
  const observer = new QueryObserver(queryKey, options);
  observer.subscribe(query => callback(query));
  return observer;
};
