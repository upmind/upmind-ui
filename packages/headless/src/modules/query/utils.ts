// --- external
import {
  isServer,
  QueryKey,
  QueryClient,
  InvalidateQueryFilters
} from "@tanstack/vue-query";

// --- utils
import { useQuery } from "./useQuery";
import { compactDeep, DetailedError, responseCodes } from "../../utils";
import {
  map,
  set,
  reduce,
  isArray,
  isObject,
  camelCase,
  includes,
  toNumber,
  reject,
  isEmpty,
  omitBy,
  compact,
  isNil,
  values
} from "lodash-es";

// ---types
import { QueryResponse, QueryResponseError } from "./types";
import { unref } from "vue";

// --- constants
export const PAGINATION = {
  offset: 0,
  limit: 10
};

// -----------------------------------------------------------------------------

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

/**
 * Invalidate a query by its key.
 * Perfect for invalidating a query after a mutation on a thenable
 * @param queryKey The key of the query to invalidate
 * @param filters Optional filters to apply when invalidating the query
 * @returns A function that takes the data and returns it after invalidating the query
 * @example
 *    put({ url: "/clients/address/1", data: { name: "New Name" } })
 *       .then(invalidateQueryByKey(["clients", client.id, "addresses"]))
 */
export const invalidateQueryByKey =
  (queryKey: QueryKey, filters?: InvalidateQueryFilters) =>
  async <T = any>(data?: T) => {
    const { queryClient } = useQuery();
    return queryClient
      .invalidateQueries({
        queryKey,
        ...filters
      })
      .then(() => data);
  };

export const resetQueryByKey =
  (queryKey: QueryKey) =>
  async <T>(data: T) => {
    const { queryClient } = useQuery();
    queryClient.removeQueries({ queryKey, exact: false });
    return data;
  };

export function canRetryAuthorization(
  url: URL,
  error: DetailedError,
  {
    attempts,
    max
  }: {
    attempts: number;
    max: number;
  }
): boolean {
  const isAuth = includes(url?.pathname, "oauth");
  // NB: the API returns a DetailedError the status code in the `.code` property of the error object,

  const isUnauthorized = error.code == responseCodes.Unauthorized;
  const value =
    !isAuth &&
    isUnauthorized &&
    Math.max(toNumber(attempts), 1) <= Math.max(toNumber(max), 1);
  // console.debug("request", "canAuthorize", {
  //   isAuth,
  //   isUnauthorized,
  //   attempts: context?.attempts,
  //   canAuthorize: value
  // });

  return value;
}

/**
 *
 * @param queryKey The query key to clean
 * @description Cleans the query key by removing empty values, objects, and arrays.
 * This is useful to avoid sending unnecessary data in the query key.
 * @returns The cleaned query key
 */
export function cleanQueryKey(queryKey: any[]): any[] {
  return values(compactDeep(queryKey));
}
