import { QueryClient } from "@tanstack/vue-query";
import { isNumber } from "lodash-es";

// Constants for time to avoid dependencies on useTime() during initialization
const MINUTE = 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default time for inactive data to be garbage collected
      gcTime: MINUTE * 30,
      // Default cache time for data to be considered "fresh"
      staleTime: MINUTE * 5,

      // Only retry on 5xx server errors — 4xx errors don't get better with
      // retries and just waste time (e.g. a 404 brand lookup retrying 3× delays
      // the unavailable-tenant redirect by several seconds)
      retry: (_failureCount, error: any) => {
        const status = error?.status ?? error?.code;
        return isNumber(status) && status >= 500;
      },

      // allow prefetching in the render phase, we need this for services and machine queries
      experimental_prefetchInRender: true
    }
  }
});
