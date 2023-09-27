// --- external
import type { Url } from "url";
import {
  State,
  interpret,
  type AnyEventObject,
  type BaseActionObject,
  type ResolveTypegenMeta,
  type ServiceMap
} from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import requestsMachine from "./requests.machine";
import { generateHash, useTime } from "./utils";
import type { useFetchParams } from "./types";

// --- utils
import { set, get, trimStart } from "lodash-es";

// --------------------------------------------------------
// create a global instance of the requests machine
// and a global object to store currentState

let currentState = null;

const service = interpret(requestsMachine, { devTools: true }).onTransition(
  state => {
    currentState = state;
  }
);
// --------------------------------------------------------

export const useApi = () => {
  // --------------------------------------------------------
  // methods

  const useUrl = (path: Url["path"]) => {
    const base = import.meta.env.VITE_API_URL;
    return [base, "api", trimStart(path, "/")].join("/");
  };

  async function request({
    url,
    init = {},
    useCache = false,
    maxAge = null
  }: useFetchParams) {
    // re-enable once we have locales
    // url?.searchParams?.set("lang", activeLocale.value);

    // safe guard
    init ??= {};

    // Enforce method & header
    set(init, "headers", { "Content-Type": "application/json" });

    const hash = generateHash(url, init);

    // first we trigger the request
    service.send({
      type: "ADD",
      data: { hash, url, init, useCache, maxAge }
    });

    // then we get the request from context
    const request = get(currentState?.context?.requests, hash);

    if (request) {
      // then we await the state of the request to be processed/cached
      await waitFor(request, state =>
        ["processed", "error"].some(state.matches)
      );

      // finnaly we return the response
      return request.state.context?.response?.data;
    }

    // todo
    throw new Error("Request not found");
  }

  // --------------------------------------------------------
  // Syntax sugar for requests

  async function getRequest({
    url,
    init = {},
    useCache = true,
    maxAge = null
  }: useFetchParams) {
    // re-enable once we have locales
    // url?.searchParams?.set("lang", activeLocale.value);

    // safe guard
    init ??= {};

    // Enforce method & header
    set(init, "method", "GET");

    return request({ url, init, useCache, maxAge });
  }

  async function postRequest({ url, data, init = {} }: useFetchParams) {
    // safe guard
    init ??= {};

    // Enforce method, header, parse body
    set(init, "method", "POST");
    set(init, "body", JSON.stringify(data));

    return request({ url, init });
  }

  async function putRequest({ url, data, init = {} }: useFetchParams) {
    // safe guard
    init ??= {};

    // Enforce method, header, parse body
    set(init, "method", "PUT");
    set(init, "body", JSON.stringify(data));

    return request({ url, init });
  }

  async function patchRequest({ url, data, init = {} }: useFetchParams) {
    // safe guard
    init ??= {};

    // Enforce method, header, parse body
    set(init, "method", "PATCH");
    set(init, "body", JSON.stringify(data));

    return request({ url, init });
  }

  async function deleteRequest({ url, data, init = {} }: useFetchParams) {
    // safe guard
    init ??= {};

    // Enforce method, header, parse body
    set(init, "method", "DELETE");
    set(init, "body", JSON.stringify(data));

    return request({ url, init });
  }
  // --------------------------------------------------------
  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    // ---
    useUrl,
    generateHash,
    useTime,
    // ---
    get: getRequest,
    post: postRequest,
    put: putRequest,
    patch: patchRequest,
    delete: deleteRequest
  };
};
