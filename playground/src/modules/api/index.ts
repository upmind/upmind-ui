// --- external
import type { Url } from "url";
import { computed } from "vue";
import { useActor, useSelector } from "@xstate/vue";
import { interpret, t } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import { requestsMachine, generateHash } from "@upmind/flow";
import type { UseApi, UseApiFunctions } from "./types";
// --- utils
import { keys, set, get } from "lodash-es";

// --------------------------------------------------------
// create a global instance of the requests machine

const service = interpret(requestsMachine, { devTools: true }).start();

// --------------------------------------------------------

export const useApi = () => {
  const { state, send } = useActor(service);

  // --------------------------------------------------------
  // methods

  function useUrl(path: Url["path"]) {
    return [import.meta.env.VITE_API_URL, "api", path].join("/");
  }

  // --------------------------------------------------------
  // Syntax sugar for the requests machine

  async function request(
    { url, init = {} }: { url: string; init: RequestInit },
    useCache = true
  ) {
    // re-enable once we have locales
    // url?.searchParams?.set("lang", activeLocale.value);

    // safe guard
    init ??= {};

    // Enforce method & header
    set(init, "headers", { "Content-Type": "application/json" });

    const hash = generateHash(url, init);

    // first we trigger the request
    send({
      type: "ADD",
      data: { hash, url, init, useCache }
    });

    // then we get the request from context
    const request = get(state.value.context.requests, hash);

    if (request) {
      // then we await the state of the request to be processed/cached
      await waitFor(request, state => state.matches("processed"));

      // finnaly we return the response
      return request.state.context.response.data;
    }

    // todo
    throw new Error("Request not found");
  }

  async function getRequest(
    { url, init = {} }: { url: string; init: RequestInit },
    useCache = true
  ) {
    // re-enable once we have locales
    // url?.searchParams?.set("lang", activeLocale.value);

    // safe guard
    init ??= {};

    // Enforce method & header
    set(init, "method", "GET");

    return request({ url, init }, useCache);
  }

  async function postRequest({
    url,
    data,
    init = {}
  }: {
    url: string;
    data: any;
    init: RequestInit;
  }) {
    // safe guard
    init ??= {};

    // Enforce method, header, parse body
    set(init, "method", "GET");
    set(init, "body", JSON.stringify(data));

    return request({ url, init });
  }

  // --------------------------------------------------------

  return {
    state,
    send,
    service,
    // ---
    count: useSelector(service, ({ context }) => keys(context.requests).length),
    requests: useSelector(service, ({ context }) => context.requests),
    // ---
    isIdle: computed(() => ["inactive"].some(state.value.matches)),
    isActive: computed(() => ["disabled"].some(state.value.matches)),
    isProcessing: computed(() =>
      ["disabled.processing", "inactive.processing", "active.processing"].some(
        state.value.matches
      )
    ),
    useUrl,
    get: getRequest,
    post: postRequest
  };
};
