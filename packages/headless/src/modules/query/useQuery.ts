// --- external
import {
  useMutation,
  useQuery as vueUseQuery,
  QueryClient,
} from "@tanstack/vue-query";

// --- internal
import { doFetch, refreshToken } from "./services";

// --- utils
import { useUrl } from "../../utils";
import { getTokenFromStorage } from "../session/utils";
import { get, set, unset, isString, reject } from "lodash-es";
import { parseData, canRetryAuthorization } from "./utils";

// --- types
import type {
  QueryResponse,
  QueryParams,
  QueryResponseError,
  RequestParams,
  MutationParams,
} from "./types";
import { Methods } from "@upmind-automation/types";
import type { DefaultError } from "@tanstack/vue-query";
import { isFunction } from "xstate/lib/utils";
import { isPromise } from "util/types";

// -----------------------------------------------------------------------------

// NB we need to create our query client here so that it can be used in the `useQuery` hook
// and this will then be used in the `useUpmind` composable, which initializes the Upmind instance
// BEFORE vue has an injectible for the query client
const queryClient = new QueryClient({});

export const useQuery = () => {
  /**
   * Sends a request with the given URL and options.
   * @see {@link RequestParams}
   * @name request
   * @async
   * @function
   *
   * @example
   *  request({ url: "/orders", withAccessToken: true }); // will use the access token from the session
   *  request({ url: "/orders", withAccessToken: "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9..." });
   *
   * @param {RequestParams} params - The request parameters.
   * @returns {Promise} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   * @throws {Error} Might throw an error if the request fails.
   */
  async function request<T extends any = any>({
    url,
    init,
    withAccessToken,
  }: RequestParams): Promise<QueryResponse<T>> {
    // safeguard
    init ??= {};
    let attempts = 0;

    // Enforce Method (default to GET)
    set(init, "method", get(init, "method", Methods.GET).toUpperCase());
    // Enforce Content Type header
    if (init.body instanceof FormData) {
      // do not set a header content type
      unset(init, "headers.Content-Type");
    } else {
      set(init, "headers.Content-Type", "application/json");
    }

    // Enforce Authorization header, if required,
    // also allows us to pass a custom token, for e.g., 2fa
    if (withAccessToken) {
      const token = isString(withAccessToken)
        ? withAccessToken
        : getTokenFromStorage()?.access_token;
      set(init, `headers.Authorization`, `Bearer ${token}`);
    }

    return doFetch<T>({ url, init }).catch(async error => {
      const requestError = error as QueryResponseError;
      attempts++;

      // allow us to retry the request if we have a 401 error, but only once (we don't want an infinite loop)
      if (canRetryAuthorization(url, error, { attempts, max: 1 })) {
        return refreshToken().then(() => {
          // get the new access token and update the access token in the request
          set(
            init,
            `headers.Authorization`,
            `Bearer ${getTokenFromStorage()?.access_token}`
          ); // finally, retry the request
          return doFetch<T>({ url, init });
        });
      }
      return Promise.reject(requestError);
    });
  }

  /**
   * Syntax sugar for sending a GET request to the server with the given URL and options.
   * @see {@link QueryParams}
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param withAccessToken The access token to use for the request. It can be a string or a boolean.
   * @param options Additional options to pass to TanStack query.
   */
  async function getAsyncRequest<TQueryFnData = unknown, TData = TQueryFnData>({
    queryKey,
    url,
    init,
    withAccessToken,
    ...options
  }: QueryParams<TQueryFnData, TData>): Promise<TData> {
    // Remove initialData from options before spreading, as it's not part of FetchQueryOptions

    return queryClient.fetchQuery<TQueryFnData, DefaultError, TData>({
      queryKey,
      queryFn: async () => {
        return request<TQueryFnData>({ url, init, withAccessToken }).then(
          response => {
            return response.data as TQueryFnData;
          }
        );
      },
      ...(options as any),
    });
  }

  /**
   * Syntax sugar for sending a GET request to the server with the given URL and options.
   * @see {@link QueryParams}
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param withAccessToken The access token to use for the request. It can be a string or a boolean.
   * @param options Additional options to pass to TanStack query.
   */
  function getRequest<TQueryFnData = unknown, TData = TQueryFnData>({
    queryKey,
    url,
    init,
    withAccessToken,
    guard,
    ...options
  }: QueryParams<TQueryFnData, TData>) {
    return vueUseQuery<TQueryFnData, DefaultError, TData>({
      queryKey,
      queryFn: async () => {
        const safeguard = isPromise(guard) ? guard() : Promise.resolve();
        return safeguard.then(() =>
          request<TQueryFnData>({ url, init, withAccessToken }).then(
            response => response.data as TQueryFnData
          )
        );
      },
      ...(options as any),
    });
  }

  /**
   * Syntax sugar for sending a POST request to the server with the given URL and options.
   * @see {@link MutationParams}
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param data The data to send with the request.
   * @param withAccessToken The access token to use for the request. It can be a string or a boolean.
   * @param options Additional options to pass to TanStack mutation.
   */
  async function postRequest<
    TData = unknown,
    TError = DefaultError,
    TVariables = void,
    TContext = unknown,
  >({
    url,
    init,
    data,
    withAccessToken,
    ...options
  }: MutationParams<
    QueryResponse<TData>,
    TError,
    TVariables,
    TContext
  >): Promise<QueryResponse<TData>> {
    // safeguard
    init ??= {};

    // Enforce method, header, parse body
    set(init, "method", Methods.POST.toUpperCase());
    set(init, "body", parseData(data));

    return useMutation({
      mutationFn: async () => request<TData>({ url, init, withAccessToken }),
      ...options,
    }).mutateAsync(data as TVariables);
  }

  /**
   * Syntax sugar for sending a PUT request to the server with the given URL and options.
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param data The data to send with the request.
   * @param withAccessToken The access token to use for the request. It can be a string or a boolean.
   * @param options Additional options to pass to TanStack mutation.
   */
  async function putRequest<
    TData = unknown,
    TError = DefaultError,
    TVariables = void,
    TContext = unknown,
  >({
    url,
    init,
    data,
    withAccessToken,
    ...options
  }: MutationParams<
    QueryResponse<TData>,
    TError,
    TVariables,
    TContext
  >): Promise<QueryResponse<TData>> {
    // safeguard
    init ??= {};

    // Enforce method, header, parse body
    set(init, "method", Methods.PUT.toUpperCase());
    set(init, "body", parseData(data));

    return useMutation({
      mutationFn: async () => request<TData>({ url, init, withAccessToken }),
      ...options,
    }).mutateAsync(data as TVariables);
  }

  /**
   * Syntax sugar for sending a PATCH request to the server with the given URL and options.
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param data The data to send with the request.
   * @param withAccessToken The access token to use for the request. It can be a string or a boolean.
   * @param options Additional options to pass to TanStack mutation.
   */
  async function patchRequest<
    TData = unknown,
    TError = DefaultError,
    TVariables = void,
    TContext = unknown,
  >({
    url,
    init,
    data,
    withAccessToken,
    ...options
  }: MutationParams<
    QueryResponse<TData>,
    TError,
    TVariables,
    TContext
  >): Promise<QueryResponse<TData>> {
    // safeguard
    init ??= {};

    // Enforce method, header, parse body
    set(init, "method", Methods.PATCH.toUpperCase());
    set(init, "body", parseData(data));

    return useMutation({
      mutationFn: async () => request<TData>({ url, init, withAccessToken }),
      ...options,
    }).mutateAsync(data as TVariables);
  }

  /**
   * Syntax sugar for sending a DELETE request to the server with the given URL and options.
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param data The data to send with the request (optional).
   * @param withAccessToken The access token to use for the request. It can be a string or a boolean.
   * @param options Additional options to pass to TanStack mutation.
   */
  async function deleteRequest<
    TData = unknown,
    TError = DefaultError,
    TVariables = void,
    TContext = unknown,
  >({
    url,
    init,
    data,
    withAccessToken,
    ...options
  }: MutationParams<
    QueryResponse<TData>,
    TError,
    TVariables,
    TContext
  >): Promise<QueryResponse<TData>> {
    // safeguard
    init ??= {};

    // Enforce method, header, parse body
    set(init, "method", Methods.DELETE.toUpperCase());
    set(init, "body", parseData(data));

    return useMutation({
      mutationFn: async () => request<TData>({ url, init, withAccessToken }),
      ...options,
    }).mutateAsync(data as TVariables);
  }

  /**
   * Syntax sugar for sending a GET request to the server with the given URL and options.
   * @see {@link RequestParams}
   * @name headRequest
   * @async
   * @function
   *
   * @example headRequest({ url: "/orders", withAccessToken: true });
   *
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param withAccessToken The access token to use for the request. It Can be a string or a boolean.
   * @param options Additional options to pass to TanStack query.
   * @returns {Promise} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   * @throws {Error} Might throw an error if the request fails.
   */
  async function headRequest<T = any>({
    url,
    init,
    withAccessToken,
  }: RequestParams): Promise<QueryResponse<T>> {
    // safeguard
    init ??= {};

    // Enforce method and header
    set(init, "method", Methods.GET.toUpperCase());
    set(init, "mode", "no-cors");

    return request<T>({ url, init, withAccessToken });
  }

  return {
    useUrl,
    // ---
    getAsync: getAsyncRequest,
    get: getRequest,
    del: deleteRequest,
    put: putRequest,
    post: postRequest,
    head: headRequest,
    patch: patchRequest,
    queryClient,
  };
};
