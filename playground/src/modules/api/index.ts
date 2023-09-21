// --- external
import type { Url } from "url";
import { computed } from "vue";
import { useActor, useSelector } from "@xstate/vue";
import { interpret } from "xstate";
// --- internal
import { requestsMachine } from "@upmind/flow";
import type { UseApi, UseApiFunctions } from "./types";
// --- utils
import { keys, set } from "lodash-es";

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

  async function get(
    { url, init = {} }: { url: string; init: RequestInit },
    useCache = true
  ) {
    // re-enable once we have locales
    // url?.searchParams?.set("lang", activeLocale.value);

    // safe guard
    init ??= {};

    // Enforce method & header
    set(init, "method", "GET");
    set(init, "headers", { "Content-Type": "application/json" });

    const response = send({
      type: "ADD",
      data: { url, init, useCache }
    });

    // todo get the actual response
    // for that we have to get the request id
    // and then await the response from the machine

    return response;
  }

  async function post({
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
    set(init, "headers", { "Content-Type": "application/json" });
    set(init, "body", JSON.stringify(data));

    const response = send({
      type: "ADD",
      data: { url, init }
    });

    // todo get the actual response
    // for that we have to get the request id
    // and then await the response from the machine

    return response;
  }

  // --------------------------------------------------------

  return {
    state,
    send,
    // ---
    count: useSelector(service, ({ context }) => keys(context.requests).length),
    cache: useSelector(service, ({ context }) => context.cache),
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
    get,
    post
  };
};
