// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.loading:invocation[0]": {
      type: "done.invoke.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.generating:invocation[0]": {
      type: "error.platform.generating:invocation[0]";
      data: unknown;
    };
    "error.platform.loading:invocation[0]": {
      type: "error.platform.loading:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#error": { type: "xstate.after(wait)#error" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    check: "done.invoke.loading:invocation[0]";
    generateBasket: "done.invoke.generating:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "check" | "generateBasket";
  };
  eventsCausingActions: {
    clearError: "RETRY";
    resetBasket: "CANCEL" | "xstate.after(wait)#error";
    setBasket: "done.invoke.loading:invocation[0]";
    setError: "error.platform.generating:invocation[0]";
  };
  eventsCausingDelays: {
    wait: "error.platform.generating:invocation[0]";
  };
  eventsCausingGuards: {};
  eventsCausingServices: {
    check: "xstate.init";
    generateBasket: "RETRY" | "error.platform.loading:invocation[0]";
  };
  matchesStates:
    | "complete"
    | "error"
    | "loading"
    | "processed"
    | "processed.available"
    | "processing"
    | "processing.generating"
    | { processed?: "available"; processing?: "generating" };
  tags: never;
}
