// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.basketManager.error.unauthorized:invocation[0]": {
      type: "done.invoke.basketManager.error.unauthorized:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
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
    "xstate.after(wait)#basketManager.error.unknown": {
      type: "xstate.after(wait)#basketManager.error.unknown";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    check: "done.invoke.loading:invocation[0]";
    generateBasket: "done.invoke.generating:invocation[0]";
    refreshToken: "done.invoke.basketManager.error.unauthorized:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "check" | "generateBasket" | "refreshToken";
  };
  eventsCausingActions: {
    clearError: "RETRY";
    resetBasket: "CANCEL" | "xstate.after(wait)#basketManager.error.unknown";
    setBasket: "done.invoke.loading:invocation[0]";
    setError: "error.platform.loading:invocation[0]";
  };
  eventsCausingDelays: {
    wait:
      | "error.platform.generating:invocation[0]"
      | "error.platform.loading:invocation[0]";
  };
  eventsCausingGuards: {
    hasNoContent: "done.invoke.loading:invocation[0]";
    isUnauthorized: "error.platform.loading:invocation[0]";
  };
  eventsCausingServices: {
    check: "xstate.init";
    generateBasket:
      | "RETRY"
      | "done.invoke.basketManager.error.unauthorized:invocation[0]";
    refreshToken: "error.platform.loading:invocation[0]";
  };
  matchesStates:
    | "complete"
    | "error"
    | "error.unauthorized"
    | "error.unknown"
    | "loading"
    | "processed"
    | "processed.available"
    | "processed.empty"
    | "processing"
    | "processing.generating"
    | {
        error?: "unauthorized" | "unknown";
        processed?: "available" | "empty";
        processing?: "generating";
      };
  tags: never;
}
