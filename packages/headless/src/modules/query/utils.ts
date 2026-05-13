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
import { type AnyUpdater, Store } from "@tanstack/vue-store";
import { isArray, isString } from "xstate/lib/utils";
import { type QueryResponse } from "./types";
import {
  type Message,
  messageDisplays,
  messageTypes,
  useFeedback
} from "../feedback";
import { useI18n } from "../system";

// --- constants

/**
 * Default pagination values for API requests.
 * These values can be used to standardise pagination across different requests.
 */
export const PAGINATION = {
  /**
   * The default offset for paginated requests, indicating the starting point for fetching data.
   * A value of 0 means fetching starts from the first item.
   */
  offset: 0,
  /**
   * The default limit for paginated requests, specifying the maximum number of items to return per page.
   */
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
  <T = any>(data?: T): Promise<T | undefined> => {
    const { queryClient } = useQuery();
    return queryClient
      .invalidateQueries({
        queryKey,
        ...filters,
        refetchType: "all",
        exact: false
      })
      .then(() => {
        // refetch the queries after invalidation but don't wait for them
        queryClient.refetchQueries({
          queryKey,
          ...filters
        });

        return data;
      })
      .catch(() => {
        return undefined;
      });
  };

/**
 * Determines if an authorisation retry is permissible based on the URL, error details, and attempt count.
 * This function is primarily used for handling authentication-related errors, such as expired tokens or unauthorised access.
 *
 * @param url - The URL of the request that resulted in an error.
 * @param error - The {@link DetailedError} object containing details about the error.
 * @param options - An object containing the current attempt count and the maximum allowed attempts.
 * @param options.attempts - The number of attempts already made for this request.
 * @param options.max - The maximum number of retries allowed.
 * @returns `true` if an authorisation retry is allowed, `false` otherwise.
 */
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
 * Cleans a query key by removing empty values, objects, and arrays.
 * This is useful for preventing unnecessary data from being included in query keys,
 * which can help in cache management and improve the accuracy of query matching.
 *
 * @param queryKey - The query key array to clean.
 * @returns The cleaned query key array with empty values removed.
 */
export function cleanQueryKey(queryKey: any[] | unknown[]): any[] {
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
 * Creates a persister for the given store that synchronises its state with localStorage
 * This persister will handle the serialisation and deserialization of the store state
 * and will also update the store state with the data from localStorage when it is retrieved.
 * This is useful for persisting the store state across browser sessions.
 *
 * @template TState - The type of the store's state.
 * @template TUpdater - The type of the store's updater function.
 * @param store The store to persist the data to
 * @param options  Optional options to configure the persister
 * @param options.append If true, the data will be appended to the store state instead of replacing it
 *                       If a string is provided, the data will be appended to the store state under that key
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
    // NB always returns a stringified value as it will be deserialized by the query client
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

    // NB: will always come as a stringified JSON of the entire QueryObject
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
 * Generates a mapping of HTTP response codes to user-facing feedback messages.
 * This function determines the appropriate message display type and content based on the status code.
 *
 * It returns an object where keys are response codes (e.g., {@link responseCodes.Too_Many_Requests})
 * and values are {@link Message} objects or `undefined` if no specific feedback is configured for that code.
 *
 * @param error - Optional {@link QueryResponseError} object from the API response.
 * @returns A record mapping response codes to their corresponding error messages or `undefined`.
 */
const mapFeedback = (
  error?: QueryResponse["error"]
): Record<number, Message | undefined> => {
  const { t } = useI18n();
  return {
    [responseCodes.Bad_Request]: undefined,
    [responseCodes.Unauthorized]: undefined,
    [responseCodes.Forbidden]: undefined,
    [responseCodes.Timeout]: undefined,
    [responseCodes.Conflict]: undefined,
    [responseCodes.Unprocessable_Entity]: undefined,
    [responseCodes.Bad_Gateway]: undefined,
    [responseCodes.Gateway_Timeout]: undefined,
    // ---
    [responseCodes.Too_Many_Requests]: {
      type: messageTypes.ERROR,
      title: t("error.429_title_md"),
      copy: t("error.429_text"),
      data: {
        ...error,
        status: responseCodes.Too_Many_Requests
      },
      display: messageDisplays.INTERSTITIAL
    },
    [responseCodes.Internal_Server_Error]: {
      type: messageTypes.ERROR,
      title: t("error.500_title_md"),
      copy: t("error.500_text"),
      data: {
        ...error,
        status: responseCodes.Internal_Server_Error
      },
      display: messageDisplays.TOAST
    },
    [responseCodes.Service_Unavailable]: {
      type: messageTypes.ERROR,
      title: t("error.503_title_md"),
      copy: t("error.503_text"),
      data: {
        ...error,
        status: responseCodes.Service_Unavailable
      },
      display: messageDisplays.INTERSTITIAL,
      delay: 0,
      maxAge: 0
    }
  };
};

/**
 * Handles errors from a query response by displaying a user-friendly feedback message
 * and then throwing a `DetailedError` for programmatic handling.
 *
 * @param status - The HTTP status code from the query response.
 * @param error - The {@link QueryResponseError} object from the query response.
 * @returns A promise that always rejects with a {@link DetailedError}, containing the mapped message and originating details.
 *
 * @throws {DetailedError} Throws a detailed error instance based on the provided status and error object.
 */
export function handleError(
  status: QueryResponse["status"],
  error: QueryResponse["error"]
): Promise<never> {
  const { t } = useI18n();

  // get the mapped the error and status to a feedback message and display it if it exists
  const feedback = get(mapFeedback(error), status);
  if (!isNil(feedback)) useFeedback().add(feedback);
  // Preserve the API's structured error code (e.g. `web_hosting::domain_register_only`)
  // on the DetailedError. Clients that need to branch on it (e.g. domain
  // register/transfer flip) read `apiCode` — message text is locale-dependent.
  throw new DetailedError(
    error?.message ?? t("error.503_title_md"),
    status || responseCodes.Service_Unavailable,
    ErrorOrigin.Upmind,
    error?.data,
    (error as any)?.code
  );
}
