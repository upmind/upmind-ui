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
    "done.invoke.request.authorizing:invocation[0]": {
      type: "done.invoke.request.authorizing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.cancel": { type: "error.platform.cancel"; data: unknown };
    "error.platform.process": { type: "error.platform.process"; data: unknown };
    "error.platform.request.authorizing:invocation[0]": {
      type: "error.platform.request.authorizing:invocation[0]";
      data: unknown;
    };
    "xstate.after(maxAge)#request.processed.cached": {
      type: "xstate.after(maxAge)#request.processed.cached";
    };
    "xstate.after(wait)#request.processed.cancelled": {
      type: "xstate.after(wait)#request.processed.cancelled";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    cancelRequest: "done.invoke.cancel";
    doFetch: "done.invoke.process";
    refreshToken: "done.invoke.request.authorizing:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "cancelRequest" | "doFetch" | "refreshToken";
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
      | "done.invoke.request.authorizing:invocation[0]"
      | "error.platform.process";
    clearResponse:
      | ""
      | "DELETE"
      | "GET"
      | "PATCH"
      | "POST"
      | "PUT"
      | "REFRESH"
      | "RETRY"
      | "done.invoke.request.authorizing:invocation[0]";
    incrementAttempts:
      | ""
      | "DELETE"
      | "GET"
      | "PATCH"
      | "POST"
      | "PUT"
      | "REFRESH"
      | "RETRY"
      | "done.invoke.request.authorizing:invocation[0]";
    sendClearRequest:
      | "CANCEL"
      | "xstate.after(wait)#request.processed.cancelled";
    setAuthHeader: "done.invoke.request.authorizing:invocation[0]";
    setError:
      | "error.platform.cancel"
      | "error.platform.process"
      | "error.platform.request.authorizing:invocation[0]";
    setRequest: "" | "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
    setResponse: "done.invoke.process";
  };
  eventsCausingDelays: {
    wait: "" | "done.invoke.cancel";
  };
  eventsCausingGuards: {
    canAuthorize: "error.platform.process";
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
    doFetch:
      | ""
      | "DELETE"
      | "GET"
      | "PATCH"
      | "POST"
      | "PUT"
      | "REFRESH"
      | "RETRY"
      | "done.invoke.request.authorizing:invocation[0]";
    refreshToken: "error.platform.process";
  };
  matchesStates:
    | "authorizing"
    | "available"
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
    | "processed.cancelled"
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
        processed?: "available" | "cached" | "cancelled" | "empty" | "stale";
      };
  tags: never;
}
