import { inspect } from "@xstate/inspect";
import { usePOP, type IApiPop, useSessionStorage } from "./utils";

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

// always honor the debug flag in the URL
if (queryParams.has("debug")) set("debug", true);

// otherwise read our debugging flag from session storage or fallback to the default ( true if DEV )
const debugging = get("debug") ?? import.meta.env.DEV;

// finally start the inspector if debugging is enabled
if (debugging)
  inspect({
    // url: "https://stately.ai/registry/editor/inspect",
    // url: "https://statecharts.io/inspect",
    // url: "https://stately.ai/viz?inspect", // (default)
    iframe: false,
  });
