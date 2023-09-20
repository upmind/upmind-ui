export * from "./modules";
export function test() {
  return "@upmind FLOW with XState!";
}

// -----------------
// TODO: Only enable this in development and/or 'debug' is enabled
import { inspect } from "@xstate/inspect";

inspect({
  // url: "https://statecharts.io/inspect",
  // url: 'https://stately.ai/viz?inspect', // (default)
  iframe: false
});
// -----------------
