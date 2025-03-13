// --- external
// --- internal

// --- utils
import { getQueryClient } from "./utils";
import { every, includes } from "lodash-es";

// --- types
import type { QueryKey, QueryCacheNotifyEvent } from "@tanstack/query-core";

export class QueryObserver {
  queryKey: QueryKey;
  queryClient = getQueryClient();

  constructor({ queryKey }: { queryKey: QueryKey }) {
    this.queryKey = queryKey;
  }

  subscribe(callback: (data: QueryCacheNotifyEvent) => void) {
    return this.queryClient
      .getQueryCache()
      .subscribe((cache: QueryCacheNotifyEvent) => {
        if (!cache) {
          return;
        }

        if (every(this.queryKey, key => includes(cache.query.queryKey, key))) {
          callback(cache);
        }
      });
  }
}
