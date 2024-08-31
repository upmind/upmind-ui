export * from "./modules";
export * as utils from "./utils";

import { inspect } from "@xstate/inspect";

// --------------------------------------------------------

const debugging = import.meta.env.DEV;

// --------------------------------------------------------

export function test() {
  return "Upmind Flow";
}

// --------------------------------------------------------

if (debugging)
  inspect({
    // url: "https://stately.ai/registry/editor/inspect",
    // url: "https://statecharts.io/inspect",
    // url: "https://stately.ai/viz?inspect", // (default)
    iframe: false,
  });
