// --- external

import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import requestsMachine from "./requests.machine";
import { generateHash } from "./utils";
import { useTime } from "../../utils";
import type { RequestParams } from "./types.d";

import { useSession } from "../session";

// --- utils
import { set, get, trimStart, forIn, keys, isString } from "lodash-es";

// --------------------------------------------------------
// create a global instance of the requests machine
// and a global object to store state

let state = null;
const service = interpret(requestsMachine, { devTools: false }).onTransition(
  newState => (state = newState)
);
// --------------------------------------------------------

export const useApi = () => {
  // --------------------------------------------------------
  // methods

  /**
   * Constructs a URL with the given path and query parameters.
   * @function
   * @param {string} path - The path to append to the base URL.
   * @param {Object} params - The query parameters to include in the URL.
   * @param {string} [prepend="api"] - The string to prepend to the path.
   * @returns {string} The constructed URL as a string.
   */
  const useUrl = (
    path: string | URL["pathname"],
    params: Object = {},
    prepend = "api"
  ) => {
    // get base url from env
    const base = import.meta.env.VITE_API_URL;

    // clean up path
    path = [prepend, trimStart(path, "/")].join("/");
    // now we can create the url
    const url = new URL(path, base);
    // and add any params
    forIn(params, (value, key) => url.searchParams.set(key, value));

    return url;
  };

  /**
   * Sends a request  with the given URL and options.
   * @async
   * @function
   * @param {RequestParams} params - The request parameters.
   * @returns {Promise<Object>} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   * @throws {Error} If the request was not found.
   */
  async function request({
    url,
    init,
    withAccessToken,
    useCache = false,
    maxAge = null
  }: RequestParams) {
    // re-enable once we have locales
    // url?.searchParams?.set("lang", activeLocale.value);

    // safe guard
    init ??= {};

    const { getToken } = useSession();

    // Enforce Method (default to GET)
    set(init, "method", get(init, "method", "GET"));

    // Enforce Content Type header
    set(init, "headers.Content-Type", "application/json");

    // Enforce Authorization header, if required
    // also allow us to pass a custom token, for eg 2fa
    if (withAccessToken) {
      const token = isString(withAccessToken) ? withAccessToken : getToken();
      set(init, `headers.Authorization`, `Bearer ${token}`);
    }

    const queue = keys(state?.context?.requests);
    const hash = generateHash(url, init, useCache, queue);

    // first we trigger the request
    service.send({
      type: "ADD",
      data: { hash, url, init, useCache, maxAge }
    });

    // then we get the request from context
    const request = get(state?.context?.requests, hash);

    if (request) {
      // finally ... await the response
      return waitFor(request, state => state.matches("processed")).then(() =>
        get(request, "state.context.response")
      );
    }

    // TODO:
    throw new Error("Request not found");
  }

  // --------------------------------------------------------
  // Syntax sugar for requests

  /**
   * Syntax sugar for sending a GET request to the server with the given URL and options.
   * @async
   * @function
   * @param {RequestParams} params - The request parameters.
   * @returns {Promise<Object>} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   */
  async function getRequest({
    url,
    init,
    withAccessToken,
    useCache = true,
    maxAge = null
  }: RequestParams) {
    // re-enable once we have locales
    // url?.searchParams?.set("lang", activeLocale.value);

    // safe guard
    init ??= {};

    // Enforce method & header
    set(init, "method", "GET");

    return request({ url, init, withAccessToken, useCache, maxAge });
  }

  /**
   * Syntax sugar for sending a POST request to the server with the given URL and options.
   * @async
   * @function
   * @param {RequestParams} params - The request parameters.
   * @returns {Promise<Object>} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   */
  async function postRequest({
    url,
    init,
    data,
    withAccessToken
  }: RequestParams) {
    // safe guard
    init ??= {};

    // Enforce method, header, parse body
    set(init, "method", "POST");
    set(init, "body", JSON.stringify(data));

    return request({ url, init, withAccessToken });
  }

  /**
   * Syntax sugar for sending a PUT request to the server with the given URL and options.
   * @async
   * @function
   * @param {RequestParams} params - The request parameters.
   * @returns {Promise<Object>} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   */
  async function putRequest({
    url,
    init,
    data,
    withAccessToken
  }: RequestParams) {
    // safe guard
    init ??= {};

    // Enforce method, header, parse body
    set(init, "method", "PUT");
    set(init, "body", JSON.stringify(data));

    return request({ url, init, withAccessToken });
  }

  /**
   * Syntax sugar for sending a PATCH request to the server with the given URL and options.
   * @async
   * @function
   * @param {RequestParams} params - The request parameters.
   * @returns {Promise<Object>} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   */
  async function patchRequest({
    url,
    init,
    data,
    withAccessToken
  }: RequestParams) {
    // safe guard
    init ??= {};

    // Enforce method, header, parse body
    set(init, "method", "PATCH");
    set(init, "body", JSON.stringify(data));

    return request({ url, init, withAccessToken });
  }

  /**
   * Syntax sugar for sending a DELETE request to the server with the given URL and options.
   * @async
   * @function
   * @param {RequestParams} params - The request parameters.
   * @returns {Promise<Object>} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   */
  async function deleteRequest({
    url,
    init,
    data,
    withAccessToken
  }: RequestParams) {
    // safe guard
    init ??= {};

    // Enforce method, header, parse body
    set(init, "method", "DELETE");
    set(init, "body", JSON.stringify(data));

    return request({ url, init, withAccessToken });
  }

  // --------------------------------------------------------

  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    // ---
    getSnapshot: () => state,
    useUrl,
    generateHash,
    useTime,
    // ---
    get: getRequest,
    post: postRequest,
    put: putRequest,
    patch: patchRequest,
    del: deleteRequest
  };
};
