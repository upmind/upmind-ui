// --- external
import { experimental_createQueryPersister } from "@tanstack/query-persist-client-core";

// --- internal
import { useQuery } from "./useQuery";

// --- utils
import {
  isNil,
  includes,
  isObject,
  merge,
  omit,
  set,
  toNumber,
  values,
  get
} from "lodash-es";
import {
  compactDeep,
  DetailedError,
  ErrorOrigin,
  responseCodes
} from "../../utils";

// ---types
import type { InvalidateQueryFilters, QueryKey } from "@tanstack/vue-query";
import { AnyUpdater, Store } from "@tanstack/vue-store";
import { isArray, isString } from "xstate/lib/utils";
import { QueryResponse } from "./types";
import {
  Message,
  messageDisplays,
  messageTypes,
  useFeedback
} from "../feedback";

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

/**
 * A persister object used to synchronize query cache data with the browser's localStorage.
 *
 * This variable is initialized using the `experimental_createQueryPersister` function
 * and applies localStorage as the underlying storage mechanism. It helps in persisting
 * query state across browser sessions.
 *
 * Note: This implementation uses the `experimental_createQueryPersister` method
 * and should be treated as an experimental feature which might be subject to changes.
 *
 * Use this persister to store application query cache data in a persistent medium,
 * ensuring data retrieval even on browser reloads or closures.
 */
export const localStoragePersister: ReturnType<
  typeof experimental_createQueryPersister
> = experimental_createQueryPersister({
  storage: localStorage
});

/**
 *
 * @param store The store to persist the data to
 * @param options  Optional options to configure the persister
 * @param options.append If true, the data will be appended to the store state instead of replacing it
 *                       If a string is provided, the data will be appended to the store state under that key
 * @description Creates a persister for the given store that synchronizes its state with localStorage
 * This persister will handle the serialization and deserialization of the store state
 * and will also update the store state with the data from localStorage when it is retrieved.
 * This is useful for persisting the store state across browser sessions.
 * @returns A persister function that can be used with the query client
 */
export const storePersister = <TState, TUpdater extends AnyUpdater>(
  store: Store<TState, TUpdater>,
  options?: {
    append?: boolean | string;
  }
): ReturnType<typeof experimental_createQueryPersister> => {
  // helper function to set the store state
  //  based on the options provided and the type of data in the store
  function setState(data: QueryResponse["data"]) {
    const state = store.state;
    if (options?.append) {
      if (isObject(state)) {
        if (isString(options.append)) {
          store.setState(state => {
            set(state ?? {}, String(options.append), data);
            return state;
          });
        } else {
          store.setState(state => {
            merge(state ?? {}, data);
            return state;
          });
        }
      } else if (isArray(state)) {
        store.setState(state => {
          const arr = state as unknown as any[];
          arr.push(...(isArray(data) ? data : [data ?? []]));
          return arr as TState;
        });
      } else {
        store.setState(data as TState);
      }
    } else {
      store.setState(data as TState);
    }
  }

  const storage = {
    // NB always returns a stringified value as it wil lbe deserialized by the query client
    // Also we ALWAYS use local storage as the source of truth
    // We also set the store state with data in local storage
    getItem: (key: string): string => {
      const query = localStorage.getItem(key);
      const parsed = isString(query) ? JSON.parse(String(query)) : query;
      const data = parsed?.state?.data as QueryResponse;
      setState(data);
      // return the query
      return query ?? "";
    },

    // NB: will always come as a strigified JSON of the entire QueryObject
    // we persist the entire query to local storage
    // and ALSO set the store state with the query data
    setItem: (key: string, query: string): void => {
      const parsed = JSON.parse(query);
      const data = parsed?.state?.data as QueryResponse;
      setState(data);

      // persist the entire query as provided by the query client
      localStorage.setItem(key, query);
    },

    removeItem: (key: string): void => {
      // set the store state with the updated values after removing the value(s)
      store.setState(state => {
        if (isObject(state) && isString(options?.append)) {
          return omit(state, options.append) as TState;
        }

        return undefined as any;
      });

      // remove the item from local storage
      localStorage.removeItem(key);
    }
  };

  return experimental_createQueryPersister({
    storage
  });
};

/**
 * Generates a mapping of HTTP response codes to user-facing error messages.
 *
 * This utility function returns an object where each key is a response code,
 * and the value is either a `Message` object describing the error or `undefined`
 * if no specific message is provided for that code.
 *
 * Some response codes (e.g., 429, 500, 503) have detailed messages including
 * type, title, copy, error data, i18n key, display type, and optional delay/maxAge.
 * Other codes return `undefined` to indicate no custom message.
 *
 * @param error - Optional error details from the query response.
 * @param status - Optional HTTP status code from the query response.
 * @returns A record mapping response codes to their corresponding error messages or `undefined`.
 */
const mapFeedback = (
  error?: QueryResponse["error"]
): Record<number, Message | undefined> => ({
  [responseCodes.Bad_Request]: undefined,
  [responseCodes.Unauthorized]: undefined,
  [responseCodes.Forbidden]: undefined,
  [responseCodes.Timeout]: undefined,
  [responseCodes.Conflict]: undefined,
  [responseCodes.Too_Many_Requests]: {
    type: messageTypes.ERROR,
    title: "Too many requests",
    copy: "You have exceeded the number of allowed requests",
    data: error,
    i18nKey: `errors.${responseCodes.Too_Many_Requests}`,
    display: messageDisplays.MODAL
  },
  [responseCodes.Unprocessable_Entity]: undefined,
  [responseCodes.Internal_Server_Error]: {
    type: messageTypes.ERROR,
    title: "Internal server error",
    copy: "An unexpected error occurred",
    data: error,
    i18nKey: `errors.${responseCodes.Internal_Server_Error}`,
    display: messageDisplays.TOAST
  },
  [responseCodes.Bad_Gateway]: undefined,
  [responseCodes.Service_Unavailable]: {
    type: messageTypes.ERROR,
    title: "Service temporarily unavailable",
    copy: "Service temporarily down for maintenance",
    data: error,
    i18nKey: `errors.${responseCodes.Service_Unavailable}`,
    display: messageDisplays.SYSTEM,
    delay: 0,
    maxAge: 0
  },
  [responseCodes.Gateway_Timeout]: undefined
});

/**
 * Handles errors from a query response by displaying a feedback message and throwing a detailed error.
 *
 * @param status - The status code from the query response.
 * @param error - The error object from the query response.
 * @returns A promise that never resolves, as it always throws an error.
 *
 * @throws {DetailedError} Throws a detailed error containing the error message, status, origin, and additional data.
 */
export function handleError(
  status: QueryResponse["status"],
  error: QueryResponse["error"]
): Promise<never> {
  const { add } = useFeedback();

  // get the mapped the error and status to a feedback message and display it if it exists
  const feedback = get(mapFeedback(error), status);
  if (!isNil(feedback)) add(feedback);

  throw new DetailedError(
    error?.message ?? "Service temporarily unavailable",
    status || responseCodes.Service_Unavailable,
    ErrorOrigin.Upmind,
    error?.data
  );
}

//TODO a machinePersister that will persist the query data in a machine context and send a REFRESH event to the machine when the data is updated
