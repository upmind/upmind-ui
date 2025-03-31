// --- external

// --- internal
import { useSession } from "../session";
import { doFetch, refreshToken } from "./services";

// --- utils
import { useUrl, responseCodes } from "../../utils";
import { parseData, getQueryClient } from "./utils";
import { get, set, unset, isString } from "lodash-es";

// --- types
import type {
  QueryParams,
  RequestError,
  QueryResponse,
  RequestParams,
} from "./types";
import { Methods } from "@upmind-automation/types";

const queryClient = getQueryClient();

export const useQuery = () => {
  // ---  // methods

  /**
   * Sends a request  with the given URL and options.
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
  async function request<T extends object = object>({
    url,
    init,
    withAccessToken,
  }: RequestParams): Promise<T> {
    // safeguard
    init ??= {};

    const { getToken } = useSession();

    // Enforce Method (default to GET)
    set(init, "method", get(init, "method", Methods.GET).toUpperCase());
    // Enforce Content Type header
    if (init.body instanceof FormData) {
      // do not set header content type
      unset(init, "headers.Content-Type");
    } else {
      set(init, "headers.Content-Type", "application/json");
    }

    // Enforce Authorization header, if required
    // also allow us to pass a custom token, for eg 2fa
    if (withAccessToken) {
      const token = isString(withAccessToken) ? withAccessToken : getToken();
      set(init, `headers.Authorization`, `Bearer ${token}`);
    }

    return doFetch<T>({ url, init }).catch(async error => {
      const requestError = error as RequestError;

      if (requestError.status === responseCodes.Unauthorized) {
        const { access_token } = await refreshToken();
        return request({ url, init, withAccessToken: access_token });
      }

      return Promise.reject(requestError);
    });
  }

  /**
   * Syntax sugar for sending a GET request to the server with the given URL and options.
   * @see {@link QueryParams}
   * @name getRequest
   * @async
   * @function
   *
   * @example getRequest({ url: "/orders", withAccessToken: true });
   *
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param allowStale Whether to allow stale data to be returned if the query is not in the cache.
   * @param withAccessToken The access token to use for the request. Can be a string or a boolean.
   * @param options Additional options to pass to TanStack query.
   * @returns {Promise} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   * @throws {Error} Might throw an error if the request fails.
   */
  async function getRequest<T = object>({
    url,
    init,
    allowStale = true,
    withAccessToken,
    ...options
  }: QueryParams<QueryResponse<T>>): Promise<QueryResponse<T>> {
    if (allowStale) {
      /**
       * ensureQueryData is an asynchronous function that can be used to get an existing query's cached data.
       * If the query does not exist, queryClient.fetchQuery will be called and its results returned.
       */
      return queryClient.ensureQueryData({
        queryFn: () =>
          request<QueryResponse<T>>({ url, init, withAccessToken }),
        ...options,
      });
    }
    /**
     * fetchQuery is an asynchronous function that can be used to fetch data from the server.
     */
    return queryClient.fetchQuery({
      queryFn: () => request<QueryResponse<T>>({ url, init, withAccessToken }),
      ...options,
    });
  }

  /**
   * Syntax sugar for sending a POST request to the server with the given URL and options.
   * @see {@link RequestParams}
   * @name postRequest
   * @async
   * @function
   *
   * @example postRequest({ url: "/orders", withAccessToken: true });
   *
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param data The data to send with the request.
   * @param withAccessToken The access token to use for the request. Can be a string or a boolean.
   * @returns {Promise} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   * @throws {Error} Might throw an error if the request fails.
   */
  async function postRequest<T = object>({
    url,
    init,
    data,
    withAccessToken,
  }: RequestParams): Promise<QueryResponse<T>> {
    // safeguard
    init ??= {};

    // Enforce method, header, parse body
    set(init, "method", Methods.POST.toUpperCase());
    set(init, "body", parseData(data));

    return request<QueryResponse<T>>({ url, init, withAccessToken });
  }

  /**
   * Syntax sugar for sending a PUT request to the server with the given URL and options.
   * @see {@link RequestParams}
   * @name putRequest
   * @async
   * @function
   *
   * @example putRequest({ url: "/orders", withAccessToken: true });
   *
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param data The data to send with the request.
   * @param withAccessToken The access token to use for the request. Can be a string or a boolean.
   * @returns {Promise} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   * @throws {Error} Might throw an error if the request fails.
   */
  async function putRequest<T = object>({
    url,
    init,
    data,
    withAccessToken,
  }: RequestParams): Promise<QueryResponse<T>> {
    // safeguard
    init ??= {};

    // Enforce method, header, parse body
    set(init, "method", Methods.PUT.toUpperCase());
    set(init, "body", JSON.stringify(data));

    return request<QueryResponse<T>>({ url, init, withAccessToken });
  }

  /**
   * Syntax sugar for sending a PATCH request to the server with the given URL and options.
   * @see {@link RequestParams}
   * @name patchRequest
   * @async
   * @function
   *
   * @example patchRequest({ url: "/orders", withAccessToken: true });
   *
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param data The data to send with the request.
   * @param withAccessToken The access token to use for the request. Can be a string or a boolean.
   * @returns {Promise} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   * @throws {Error} Might throw an error if the request fails.
   */
  async function patchRequest<T = object>({
    url,
    init,
    data,
    withAccessToken,
  }: RequestParams): Promise<QueryResponse<T>> {
    // safeguard
    init ??= {};

    // Enforce method, header, parse body
    set(init, "method", Methods.PATCH.toUpperCase());
    set(init, "body", JSON.stringify(data));
    return request<QueryResponse<T>>({ url, init, withAccessToken });
  }

  /**
   * Syntax sugar for sending a DELETE request to the server with the given URL and options.
   * @see {@link RequestParams}
   * @name deleteRequest
   * @async
   * @function
   *
   * @example deleteRequest({ url: "/orders", withAccessToken: true });
   *
   * @param url The URL to send the request to.
   * @param init The request options.
   * @param data The data to send with the request.
   * @param withAccessToken The access token to use for the request. Can be a string or a boolean.
   * @returns {Promise} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   * @throws {Error} Might throw an error if the request fails.
   */
  async function deleteRequest<T = object>({
    url,
    init,
    data,
    withAccessToken,
  }: RequestParams): Promise<QueryResponse<T>> {
    // safeguard
    init ??= {};

    // Enforce method, header, parse body
    set(init, "method", Methods.DELETE.toUpperCase());
    set(init, "body", JSON.stringify(data));

    return request<QueryResponse<T>>({ url, init, withAccessToken });
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
   * @param withAccessToken The access token to use for the request. Can be a string or a boolean.
   * @param options Additional options to pass to TanStack query.
   * @returns {Promise} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   * @throws {Error} Might throw an error if the request fails.
   */
  async function headRequest<T = object>({
    url,
    init,
    withAccessToken,
  }: RequestParams): Promise<QueryResponse<T>> {
    // safeguard
    init ??= {};

    // Enforce method & header
    set(init, "method", Methods.GET.toUpperCase());
    set(init, "mode", "no-cors");

    return request<QueryResponse<T>>({ url, init, withAccessToken });
  }

  return {
    useUrl,
    // ---
    get: getRequest,
    del: deleteRequest,
    put: putRequest,
    post: postRequest,
    head: headRequest,
    patch: patchRequest,
    // ---
    queryClient,
  };
};
