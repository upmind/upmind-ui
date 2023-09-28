// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.generating:invocation[0]": {
      type: "done.invoke.generating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.loading:invocation[0]": {
      type: "done.invoke.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.persisting:invocation[0]": {
      type: "done.invoke.persisting:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.refreshing:invocation[0]": {
      type: "done.invoke.refreshing:invocation[0]";
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
    "error.platform.refreshing:invocation[0]": {
      type: "error.platform.refreshing:invocation[0]";
      data: unknown;
    };
    "xstate.after(expires)#sessionManager.processed.available": {
      type: "xstate.after(expires)#sessionManager.processed.available";
    };
    "xstate.after(wait)#error": { type: "xstate.after(wait)#error" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    check: "done.invoke.loading:invocation[0]";
    generateToken: "done.invoke.generating:invocation[0]";
    persistToken: "done.invoke.persisting:invocation[0]";
    refreshToken: "done.invoke.refreshing:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "check" | "generateToken" | "persistToken" | "refreshToken";
  };
  eventsCausingActions: {
    clearError: "RETRY";
    resetToken: "CANCEL" | "xstate.after(wait)#error";
    setError:
      | "error.platform.generating:invocation[0]"
      | "error.platform.refreshing:invocation[0]";
    setToken:
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.loading:invocation[0]"
      | "done.invoke.refreshing:invocation[0]";
  };
  eventsCausingDelays: {
    expires:
      | "done.invoke.loading:invocation[0]"
      | "done.invoke.persisting:invocation[0]";
    wait:
      | "error.platform.generating:invocation[0]"
      | "error.platform.refreshing:invocation[0]";
  };
  eventsCausingGuards: {
    hasExpiry: "xstate.after(expires)#sessionManager.processed.available";
  };
  eventsCausingServices: {
    check: "xstate.init";
    generateToken: "REFRESH" | "RETRY" | "error.platform.loading:invocation[0]";
    persistToken:
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.refreshing:invocation[0]";
    refreshToken: "REFRESH";
  };
  matchesStates:
    | "complete"
    | "error"
    | "loading"
    | "persisting"
    | "processed"
    | "processed.available"
    | "processed.stale"
    | "processing"
    | "processing.generating"
    | "processing.refreshing"
    | {
        processed?: "available" | "stale";
        processing?: "generating" | "refreshing";
      };
  tags: never;
}
