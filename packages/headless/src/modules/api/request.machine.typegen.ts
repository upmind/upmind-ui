// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
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
    doFetch: "done.invoke.process";
    refreshToken: "done.invoke.request.authorizing:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "doFetch" | "refreshToken";
  };
  eventsCausingActions: {
    clearError:
      | ""
      | "REFRESH"
      | "RETRY"
      | "done.invoke.request.authorizing:invocation[0]"
      | "error.platform.process";
    clearResponse:
      | ""
      | "REFRESH"
      | "RETRY"
      | "done.invoke.request.authorizing:invocation[0]";
    incrementAttempts:
      | ""
      | "REFRESH"
      | "RETRY"
      | "done.invoke.request.authorizing:invocation[0]";
    sendClearRequest:
      | "CANCEL"
      | "xstate.after(wait)#request.processed.cancelled";
    setAuthHeader: "done.invoke.request.authorizing:invocation[0]";
    setError:
      | "error.platform.process"
      | "error.platform.request.authorizing:invocation[0]";
    setResponse: "done.invoke.process";
  };
  eventsCausingDelays: {
    wait: "" | "CANCELLED";
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
    doFetch:
      | ""
      | "REFRESH"
      | "RETRY"
      | "done.invoke.request.authorizing:invocation[0]";
    refreshToken: "error.platform.process";
  };
  matchesStates:
    | "authorizing"
    | "available"
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
