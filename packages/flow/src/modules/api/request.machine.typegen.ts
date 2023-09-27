// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.cancel": {
      type: "done.invoke.cancel";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.process": {
      type: "done.invoke.process";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.cancel": { type: "error.platform.cancel"; data: unknown };
    "error.platform.process": { type: "error.platform.process"; data: unknown };
    "xstate.after(maxAge)#request.error": {
      type: "xstate.after(maxAge)#request.error";
    };
    "xstate.after(maxAge)#request.processed.cached": {
      type: "xstate.after(maxAge)#request.processed.cached";
    };
    "xstate.after(maxAge)#request.processed.stale": {
      type: "xstate.after(maxAge)#request.processed.stale";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    cancelRequest: "done.invoke.cancel";
    doFetch: "done.invoke.process";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "cancelRequest" | "doFetch";
  };
  eventsCausingActions: {
    clearError: "RETRY";
    clearResponse:
      | ""
      | "DELETE"
      | "GET"
      | "PATCH"
      | "POST"
      | "PUT"
      | "REFRESH"
      | "RETRY";
    sendClearRequest:
      | "CANCEL"
      | "xstate.after(maxAge)#request.error"
      | "xstate.after(maxAge)#request.processed.stale";
    setError: "error.platform.cancel" | "error.platform.process";
    setRequest: "" | "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
    setResponse: "done.invoke.process";
  };
  eventsCausingDelays: {
    maxAge:
      | "error.platform.cancel"
      | "error.platform.process"
      | "xstate.after(maxAge)#request.processed.cached";
  };
  eventsCausingGuards: {};
  eventsCausingServices: {
    cancelRequest: "CANCEL";
    doFetch:
      | ""
      | "DELETE"
      | "GET"
      | "PATCH"
      | "POST"
      | "PUT"
      | "REFRESH"
      | "RETRY";
  };
  matchesStates:
    | "available"
    | "cancelling"
    | "complete"
    | "error"
    | "processed"
    | "processed.available"
    | "processed.cached"
    | "processed.stale"
    | "processing"
    | { processed?: "available" | "cached" | "stale" };
  tags: never;
}
