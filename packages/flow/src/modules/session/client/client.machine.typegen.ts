// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.complete:invocation[0]": {
      type: "done.invoke.complete:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
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
    "error.platform.complete:invocation[0]": {
      type: "error.platform.complete:invocation[0]";
      data: unknown;
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
    "xstate.after(expires)#client.authenticated.idle": {
      type: "xstate.after(expires)#client.authenticated.idle";
    };
    "xstate.after(wait)#error": { type: "xstate.after(wait)#error" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    check: "done.invoke.loading:invocation[0]";
    dumpToken: "done.invoke.complete:invocation[0]";
    generateToken: "done.invoke.generating:invocation[0]";
    persistToken: "done.invoke.persisting:invocation[0]";
    refreshToken: "done.invoke.refreshing:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services:
      | "check"
      | "dumpToken"
      | "generateToken"
      | "persistToken"
      | "refreshToken";
  };
  eventsCausingActions: {
    clearError: "RETRY";
    clearToken:
      | "done.invoke.complete:invocation[0]"
      | "error.platform.loading:invocation[0]";
    setError:
      | "error.platform.complete:invocation[0]"
      | "error.platform.generating:invocation[0]"
      | "error.platform.refreshing:invocation[0]";
    setToken:
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.loading:invocation[0]"
      | "done.invoke.refreshing:invocation[0]";
  };
  eventsCausingDelays: {
    expires: "done.invoke.persisting:invocation[0]";
    wait:
      | "error.platform.complete:invocation[0]"
      | "error.platform.generating:invocation[0]"
      | "error.platform.refreshing:invocation[0]";
  };
  eventsCausingGuards: {
    hasExpiry: "xstate.after(expires)#client.authenticated.idle";
  };
  eventsCausingServices: {
    check: "RETRY" | "xstate.init";
    dumpToken: "KILL" | "xstate.after(wait)#error";
    generateToken: "LOGIN";
    persistToken:
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.loading:invocation[0]"
      | "done.invoke.refreshing:invocation[0]";
    refreshToken: "REFRESH";
  };
  matchesStates:
    | "authenticated"
    | "authenticated.idle"
    | "authenticated.persisting"
    | "authenticated.stale"
    | "complete"
    | "error"
    | "loading"
    | "unauthenticated"
    | "unauthenticated.generating"
    | "unauthenticated.idle"
    | "unauthenticated.refreshing"
    | {
        authenticated?: "idle" | "persisting" | "stale";
        unauthenticated?: "generating" | "idle" | "refreshing";
      };
  tags: never;
}
