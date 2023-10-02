// --- external
import type { Url } from "url";
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { useSession } from "../session";
import requestsMachine from "./requests.machine";
import { generateHash } from "./utils";
import { useTime } from "../../utils";
import type { RequestParams } from "./types";

// --- utils
import { set, get, trimStart, forIn } from "lodash-es";

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

  const useUrl = (path: Url["path"], params: Object, prepend = "api") => {
    // get base url from env
    const base = import.meta.env.VITE_API_URL;

    // clean up path
    path = [prepend, trimStart(path, "/")].join("/");
    // now we can create the url
    const url = new URL(path, base);

    // and add any params
    forIn(params, (value, key) => url.searchParams.set(key, value));

    const safeUrl = url.toString();
    return safeUrl;
  };

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

    // Enforce Method (default to GET)
    set(init, "method", get(init, "method", "GET"));

    // Enforce Content Type header
    set(init, "headers.Content-Type", "application/json");

    // Enforce Authorization header, if required
    if (withAccessToken) {
      const { token } = useSession();
      set(init, `headers.Authorization`, `Bearer ${token}`);
    }

    const hash = generateHash(url.toString(), init);

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
