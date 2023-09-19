export * from "./machines";

import { inspect } from "@xstate/inspect";

inspect({
  // url: "https://statecharts.io/inspect",
  // url: 'https://stately.ai/viz?inspect', // (default)
  iframe: false
});

export function test() {
  return "Hello from @upmind FLOW!";
}
