// --- external

// --- utils
import { isServer, QueryClient } from "@tanstack/query-core";
import { map, set, reduce, isArray, isObject, camelCase } from "lodash-es";

// ---  Constants

export const PAGINATION = {
  offset: 0,
  pageSize: 10,
  pageIndex: 1,
};

// ---  Variables

/**
 * The query client for the browser
 */
export let browserQueryClient: QueryClient | undefined = undefined;

// ---  Functions

/**
 * Create a new query client
 */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // With SSR, we usually want to set some default staleTime
        // above 0 to avoid re-fetching immediately on the client
        staleTime: 60 * 1000, // 60 seconds
      },
    },
  });
}

/**
 * Get the query client for the current environment.
 * This is important to ensure we don't lose the query on the client side
 */
export function getQueryClient(): QueryClient {
  if (isServer) {
    // Server: always make a new query client
    return createQueryClient();
  } else {
    // Browser: make a new query client if we don't already have one
    // This is very important, so we don't re-make a new client if React
    // suspends during the initial render. This may not be needed if we
    // have a suspense boundary BELOW the creation of the query client
    if (!browserQueryClient) browserQueryClient = createQueryClient();
    return browserQueryClient;
  }
}

/**
 * Ensure all keys in the response are camelCase
 * @param response The response to ensure camelCase keys for (can be an object or an array)
 * @returns The response with all keys in camelCase
 */
export function ensureCamelCaseKeys(response: any): any {
  if (isArray(response)) return map(response, ensureCamelCaseKeys);

  if (!isObject(response)) return response;

  // now we know we definitely have an object
  return reduce(
    response,
    (result, value: any, key) => {
      value = ensureCamelCaseKeys(value);
      set(result, camelCase(key), value);
      return result;
    },
    {}
  );
}

/**
 * Parse the data to be sent in the request body (e.g. JSON.stringify)
 * @param data The data to parse (can be an object or a FormData)
 * @returns The parsed data
 */
export function parseData(data: any) {
  if (data instanceof FormData) return data;

  if (isObject(data)) return JSON.stringify(data);

  return data;
}
