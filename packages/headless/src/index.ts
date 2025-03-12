export * from "./modules";
export * as utils from "./utils";

import { inspect } from "@xstate/inspect";

import { usePOP, type IApiPop } from "./utils";

// ---
const queryParams = new URLSearchParams(window.location.search);
const debugging = import.meta.env.DEV || queryParams.has("debug");

// ---
export const useUpmind = (pop?: IApiPop) => {
  const { isReady } = usePOP(pop);
  return isReady();
};
// ---
if (debugging)
  inspect({
    // url: "https://stately.ai/registry/editor/inspect",
    // url: "https://statecharts.io/inspect",
    // url: "https://stately.ai/viz?inspect", // (default)
    iframe: false,
  });
