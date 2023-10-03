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
    "done.invoke.request.error.unauthorized:invocation[0]": {
      type: "done.invoke.request.error.unauthorized:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.cancel": { type: "error.platform.cancel"; data: unknown };
    "error.platform.process": { type: "error.platform.process"; data: unknown };
    "xstate.after(maxAge)#request.processed.cached": {
      type: "xstate.after(maxAge)#request.processed.cached";
    };
    "xstate.after(wait)#request.processed.stale": {
      type: "xstate.after(wait)#request.processed.stale";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    cancelRequest: "done.invoke.cancel";
    doAuth: "done.invoke.request.error.unauthorized:invocation[0]";
    doFetch: "done.invoke.process";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "cancelRequest" | "doAuth" | "doFetch";
  };
  eventsCausingActions: {
    clearError:
      | ""
      | "DELETE"
      | "GET"
      | "PATCH"
      | "POST"
      | "PUT"
      | "REFRESH"
      | "RETRY"
      | "done.invoke.request.error.unauthorized:invocation[0]";
    clearResponse:
      | ""
      | "DELETE"
      | "GET"
      | "PATCH"
      | "POST"
      | "PUT"
      | "REFRESH"
      | "RETRY"
      | "done.invoke.request.error.unauthorized:invocation[0]";
    incrementAttempts:
      | ""
      | "DELETE"
      | "GET"
      | "PATCH"
      | "POST"
      | "PUT"
      | "REFRESH"
      | "RETRY"
      | "done.invoke.request.error.unauthorized:invocation[0]";
    sendClearRequest: "CANCEL" | "xstate.after(wait)#request.processed.stale";
    setAuthHeader: "done.invoke.request.error.unauthorized:invocation[0]";
    setError: "error.platform.cancel" | "error.platform.process";
    setRequest: "" | "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
    setResponse: "done.invoke.process";
  };
  eventsCausingDelays: {
    wait: "xstate.after(maxAge)#request.processed.cached";
  };
  eventsCausingGuards: {
    hasConflict: "";
    hasRequest: "";
    hasRetried: "";
    hasTooManyRequests: "";
    isForbidden: "";
    isNotFound: "";
    isUnauthorized: "";
  };
  eventsCausingServices: {
    cancelRequest: "CANCEL";
    doAuth: "";
    doFetch:
      | ""
      | "DELETE"
      | "GET"
      | "PATCH"
      | "POST"
      | "PUT"
      | "REFRESH"
      | "RETRY"
      | "done.invoke.request.error.unauthorized:invocation[0]";
  };
  matchesStates:
    | "available"
    | "cancelled"
    | "cancelling"
    | "complete"
    | "error"
    | "error.conflict"
    | "error.forbidden"
    | "error.loading"
    | "error.notFound"
    | "error.tooManyRequests"
    | "error.unauthorized"
    | "error.unknown"
    | "processed"
    | "processed.available"
    | "processed.cached"
    | "processed.empty"
    | "processed.stale"
    | "processing"
    | {
        error?:
          | "conflict"
          | "forbidden"
          | "loading"
          | "notFound"
          | "tooManyRequests"
          | "unauthorized"
          | "unknown";
        processed?: "available" | "cached" | "empty" | "stale";
      };
  tags: never;
}
