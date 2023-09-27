// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.checking:invocation[0]": {
      type: "done.invoke.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.sessionManager.generating.basket:invocation[0]": {
      type: "done.invoke.sessionManager.generating.basket:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.sessionManager.generating.token:invocation[0]": {
      type: "done.invoke.sessionManager.generating.token:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.checking:invocation[0]": {
      type: "error.platform.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.sessionManager.generating.basket:invocation[0]": {
      type: "error.platform.sessionManager.generating.basket:invocation[0]";
      data: unknown;
    };
    "error.platform.sessionManager.generating.token:invocation[0]": {
      type: "error.platform.sessionManager.generating.token:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#error": { type: "xstate.after(wait)#error" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    check: "done.invoke.checking:invocation[0]";
    generateBasket: "done.invoke.sessionManager.generating.basket:invocation[0]";
    generateGuestToken: "done.invoke.sessionManager.generating.token:invocation[0]";
  };
  missingImplementations: {
    actions: "sendClearRequest";
    delays: never;
    guards: never;
    services: "check" | "generateBasket" | "generateGuestToken";
  };
  eventsCausingActions: {
    clearError: "RETRY";
    sendClearRequest: "CANCEL" | "xstate.after(wait)#error";
    setBasket:
      | "done.invoke.checking:invocation[0]"
      | "done.invoke.sessionManager.generating.basket:invocation[0]";
    setError:
      | "error.platform.checking:invocation[0]"
      | "error.platform.sessionManager.generating.basket:invocation[0]"
      | "error.platform.sessionManager.generating.token:invocation[0]";
    setToken:
      | "done.invoke.checking:invocation[0]"
      | "done.invoke.sessionManager.generating.token:invocation[0]";
  };
  eventsCausingDelays: {
    wait:
      | "error.platform.sessionManager.generating.basket:invocation[0]"
      | "error.platform.sessionManager.generating.token:invocation[0]";
  };
  eventsCausingGuards: {};
  eventsCausingServices: {
    check: "xstate.init";
    generateBasket: "done.invoke.sessionManager.generating.token:invocation[0]";
    generateGuestToken: "error.platform.checking:invocation[0]";
  };
  matchesStates:
    | "checking"
    | "complete"
    | "error"
    | "generating"
    | "generating.basket"
    | "generating.token"
    | "processed"
    | "processed.available"
    | "processed.stale"
    | "processing"
    | { generating?: "basket" | "token"; processed?: "available" | "stale" };
  tags: never;
}
