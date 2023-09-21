export * from "./modules";
export function test() {
  return "Upmind Flow";
}

// --------------------------------------------------------
// TODO: Only enable this in development and/or 'debug' is enabled
import { inspect } from "@xstate/inspect";

if (process.env.NODE_ENV == "development") {
  inspect({
    // url: "https://statecharts.io/inspect",
    // url: 'https://stately.ai/viz?inspect', // (default)
    iframe: false
  });
}
