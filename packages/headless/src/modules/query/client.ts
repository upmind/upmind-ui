import { QueryClient } from "@tanstack/vue-query";

// Constants for time to avoid dependencies on useTime() during initialization
const MINUTE = 60 * 1000;

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Default time for inactive data to be garbage collected
      gcTime: MINUTE * 30,
      // Default cache time for data to be considered "fresh"
      staleTime: MINUTE * 5,

      // allow prefetching in the render phase, we need this for services and machine queries
      experimental_prefetchInRender: true
    }
  }
});
