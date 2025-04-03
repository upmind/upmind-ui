// --- external
// --- internal

// --- utils
import { getQueryClient } from "./utils";
import { every, includes, some } from "lodash-es";

// --- types
import type { QueryKey, QueryCacheNotifyEvent } from "@tanstack/query-core";

export class QueryObserver {
  queryKey: QueryKey;
  options?: {
    exact?: boolean;
  };
  queryClient = getQueryClient();
  private subscription: (() => void) | undefined;

  constructor(queryKey: QueryKey, options?: { exact: boolean }) {
    this.queryKey = queryKey;
    this.options = options ?? {};
  }

  subscribe(callback: (query: QueryCacheNotifyEvent["query"]) => void) {
    const queryCache = this.queryClient.getQueryCache();

    // set up the query cache
    const query = queryCache.find({ queryKey: this.queryKey });
    if (query) callback(query);

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
