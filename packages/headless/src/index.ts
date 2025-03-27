import { inspect } from "@xstate/inspect";
import { usePOP, type IApiPop } from "./utils/usePOP";
import { useSessionStorage } from "./utils";

export * from "./modules";
export * as utils from "./utils";
export type { IApiPop };

// -----------------------------------------------------------------------------

export const useUpmind = (pop?: IApiPop) => {
  const { isReady } = usePOP(pop);
  return isReady();
};

// -----------------------------------------------------------------------------
// Debugging
// We now persist debugging to sessionStorage so we can debug an entire session
// without having to pass the debug flag in the URL every time.

const { get, set } = useSessionStorage();
const queryParams = new URLSearchParams(window.location.search);

if (import.meta.env.DEV || queryParams.has("debug")) {
  set("debug", true);
}

// read our debugging flag from session storage
const debugging = get("debug") ?? false;

// finally start the inspector if debugging is enabled
if (debugging)
  inspect({
    // url: "https://stately.ai/registry/editor/inspect",
    // url: "https://statecharts.io/inspect",
    // url: "https://stately.ai/viz?inspect", // (default)
    iframe: false,
  });
