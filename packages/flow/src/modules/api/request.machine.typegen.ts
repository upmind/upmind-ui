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
    "xstate.after(maxAge)#request.processed.cached": {
      type: "xstate.after(maxAge)#request.processed.cached";
    };
    "xstate.after(wait)#request.error.unknown": {
      type: "xstate.after(wait)#request.error.unknown";
    };
    "xstate.after(wait)#request.processed.stale": {
      type: "xstate.after(wait)#request.processed.stale";
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
      | "xstate.after(wait)#request.error.unknown"
      | "xstate.after(wait)#request.processed.stale";
    setError: "error.platform.cancel" | "error.platform.process";
    setRequest: "" | "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
    setResponse: "done.invoke.process";
  };
  eventsCausingDelays: {
    wait:
      | "error.platform.cancel"
      | "error.platform.process"
      | "xstate.after(maxAge)#request.processed.cached";
  };
  eventsCausingGuards: {
    hasConflict: "error.platform.process";
    hasTooManyRequests: "error.platform.process";
    isForbidden: "error.platform.process";
    isNotFound: "error.platform.process";
    isUnauthorized: "error.platform.process";
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
      | "RETRY";
  };
  matchesStates:
    | "available"
    | "cancelling"
    | "complete"
    | "error"
    | "error.conflict"
    | "error.forbidden"
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
          | "notFound"
          | "tooManyRequests"
          | "unauthorized"
          | "unknown";
        processed?: "available" | "cached" | "empty" | "stale";
      };
  tags: never;
}

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
    "xstate.after(maxAge)#request.processed.cached": {
      type: "xstate.after(maxAge)#request.processed.cached";
    };
    "xstate.after(wait)#request.error.unknown": {
      type: "xstate.after(wait)#request.error.unknown";
    };
    "xstate.after(wait)#request.processed.stale": {
      type: "xstate.after(wait)#request.processed.stale";
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
      | "xstate.after(wait)#request.error.unknown"
      | "xstate.after(wait)#request.processed.stale";
    setError: "error.platform.cancel" | "error.platform.process";
    setRequest: "" | "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
    setResponse: "done.invoke.process";
  };
  eventsCausingDelays: {
    wait:
      | "error.platform.cancel"
      | "error.platform.process"
      | "xstate.after(maxAge)#request.processed.cached";
  };
  eventsCausingGuards: {
    hasConflict: "error.platform.process";
    hasTooManyRequests: "error.platform.process";
    isForbidden: "error.platform.process";
    isNotFound: "error.platform.process";
    isUnauthorized: "error.platform.process";
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
      | "RETRY";
  };
  matchesStates:
    | "available"
    | "cancelling"
    | "complete"
    | "error"
    | "error.conflict"
    | "error.forbidden"
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
          | "notFound"
          | "tooManyRequests"
          | "unauthorized"
          | "unknown";
        processed?: "available" | "cached" | "empty" | "stale";
      };
  tags: never;
}
