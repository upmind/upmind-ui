export * from "./modules";
export * as utils from "./utils";

export function test() {
  return "Upmind Flow";
}

// --------------------------------------------------------
// TODO: Only enable this in development and/or 'debug' is enabled
import { inspect } from "@xstate/inspect";

if (process.env.NODE_ENV == "development") {
  inspect({
    // url: "https://stately.ai/registry/editor/inspect",
    // url: "https://statecharts.io/inspect",
    // url: "https://stately.ai/viz?inspect", // (default)
    iframe: false
  });
}
