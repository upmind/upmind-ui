// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.clearing:invocation[0]": {
      type: "done.invoke.clearing:invocation[0]";
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
    "xstate.init": { type: "xstate.init" };
    "xstate.stop": { type: "xstate.stop" };
  };
  invokeSrcNameMap: {
    check: "done.invoke.loading:invocation[0]";
    dumpToken: "done.invoke.clearing:invocation[0]";
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
    clearError: "done.invoke.clearing:invocation[0]" | "xstate.init";
    clearToken:
      | "done.invoke.clearing:invocation[0]"
      | "error.platform.loading:invocation[0]"
      | "xstate.stop";
    setError:
      | "error.platform.generating:invocation[0]"
      | "error.platform.refreshing:invocation[0]";
    setToken:
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.loading:invocation[0]"
      | "done.invoke.refreshing:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    isRefreshing: "" | "done.invoke.clearing:invocation[0]";
    isUnauthorized: "error.platform.refreshing:invocation[0]";
  };
  eventsCausingServices: {
    check: "done.invoke.clearing:invocation[0]" | "xstate.init";
    dumpToken: "error.platform.refreshing:invocation[0]";
    generateToken: "";
    persistToken: "" | "done.invoke.refreshing:invocation[0]";
    refreshToken: "";
  };
  matchesStates:
    | "authenticated"
    | "authenticated.clearing"
    | "authenticated.idle"
    | "authenticated.persisting"
    | "authenticated.refreshing"
    | "complete"
    | "error"
    | "loading"
    | "unauthenticated"
    | "unauthenticated.generating"
    | "unauthenticated.idle"
    | {
        authenticated?: "clearing" | "idle" | "persisting" | "refreshing";
        unauthenticated?: "generating" | "idle";
      };
  tags: never;
}
