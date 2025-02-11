// --- external

import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import requestsMachine from "./requests.machine";
import { generateHash } from "./utils";
import { useTime } from "../../utils";
import type { RequestParams } from "./types";

import { useSession } from "../session";
export { responseCodes } from "../../utils";

// --- utils
import { useUrl } from "../../utils";
import { parseData } from "./utils";
import { set, get, unset, keys, isString } from "lodash-es";

// --------------------------------------------------------
// create a global instance of the requests machine
// and a global object to store state

const service: any = interpret(requestsMachine, {
  devTools: false,
});

// --------------------------------------------------------

export const useApi = () => {
  // --------------------------------------------------------
  // methods

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
    maxAge = undefined,
    refresh = false,
  }: RequestParams) {
    // re-enable once we have locales
    // url?.searchParams?.set("lang", activeLocale.value);

    // safe guard
    init ??= {};

    const { getToken } = useSession();

    // Enforce Method (default to GET)
    set(init, "method", get(init, "method", "GET"));

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

    const state = service.getSnapshot();
    const queue = keys(state?.context?.requests);
    const hash = generateHash(url, init, useCache, queue);

    // first we trigger the request
    service.send({
      type: "ADD",
      data: { hash, url, init, useCache, maxAge, refresh },
    });

    // then we get the request from context
    const request = get(state?.context?.requests, hash);

    if (request) {
      // finally ... await the response
      return new Promise((resolve, reject) => {
        waitFor(request, state => ["processed", "error"].some(state.matches), {
          timeout: Infinity, // infinity = no timeout
        })
          .then(() => {
            if (request.state.matches("processed")) {
              resolve(get(request, "state.context.response"));
            } else {
              reject(get(request, "state.context.error"));
            }
          })
          .catch(error => {
            console.error(
              "api request",
              "timeout",
              { hash, url, init, useCache, maxAge },
              error
            );
            // throw error;
            reject(error);
          });
      });
    }

    // TODO:
    return Promise.reject("Request not found");
  }

  // --------------------------------------------------------
  // Syntax sugar for requests

  /**
   * Syntax sugar for sending a GET request to the server with the given URL and options.
   *
   * @param {RequestParams} params - The request parameters.
   * @returns {Promise<Object>} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   */
  async function getRequest({
    url,
    init,
    withAccessToken,
    useCache = true,
    maxAge = undefined,
    refresh = false,
  }: RequestParams) {
    // re-enable once we have locales
    // url?.searchParams?.set("lang", activeLocale.value);

    // safe guard
    init ??= {};

    // Enforce method & header
    set(init, "method", "GET");

    return request({ url, init, withAccessToken, useCache, maxAge, refresh });
  }

  /**
   * Syntax sugar for sending a POST request to the server with the given URL and options.
   *
   * @param {RequestParams} params - The request parameters.
   * @returns {Promise<Object>} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   */
  async function postRequest({
    url,
    init,
    data,
    withAccessToken,
  }: RequestParams) {
    // safe guard
    init ??= {};

    // Enforce method, header, parse body
    set(init, "method", "POST");
    set(init, "body", parseData(data));

    return request({ url, init, withAccessToken });
  }

  /**
   * Syntax sugar for sending a PUT request to the server with the given URL and options.
   *
   * @param {RequestParams} params - The request parameters.
   * @returns {Promise<Object>} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   */
  async function putRequest({
    url,
    init,
    data,
    withAccessToken,
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
   *
   * @param {RequestParams} params - The request parameters.
   * @returns {Promise<Object>} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   */
  async function patchRequest({
    url,
    init,
    data,
    withAccessToken,
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
   *
   * @param {RequestParams} params - The request parameters.
   * @returns {Promise<Object>} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   */
  async function deleteRequest({
    url,
    init,
    data,
    withAccessToken,
  }: RequestParams) {
    // safe guard
    init ??= {};

    // Enforce method, header, parse body
    set(init, "method", "DELETE");
    set(init, "body", JSON.stringify(data));

    return request({ url, init, withAccessToken });
  }

  /**
   * Syntax sugar for sending a GET request to the server with the given URL and options.
   *
   * @param {RequestParams} params - The request parameters.
   * @returns {Promise<Object>} A promise that resolves to the response data if the request was successful, or rejects with an error if the request failed.
   */
  async function headRequest({
    url,
    init,
    withAccessToken,
    useCache = true,
    maxAge = undefined,
  }: RequestParams) {
    // re-enable once we have locales
    // url?.searchParams?.set("lang", activeLocale.value);

    // safe guard
    init ??= {};

    // Enforce method & header
    set(init, "method", "GET");
    set(init, "mode", "no-cors");

    return request({ url, init, withAccessToken, useCache, maxAge });
  }
  // --------------------------------------------------------

  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    // ---
    getSnapshot: service.getSnapshot,
    useUrl,
    generateHash,
    useTime,
    // ---
    get: getRequest,
    post: postRequest,
    put: putRequest,
    patch: patchRequest,
    del: deleteRequest,
    head: headRequest,
  };
};
