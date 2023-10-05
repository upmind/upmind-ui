// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.clearing:invocation[0]": {
      type: "done.invoke.clearing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.client": {
      type: "done.invoke.client";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.guest": {
      type: "done.invoke.guest";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.sessionManager.loading.check:invocation[0]": {
      type: "done.invoke.sessionManager.loading.check:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.client": { type: "error.platform.client"; data: unknown };
    "error.platform.guest": { type: "error.platform.guest"; data: unknown };
    "error.platform.sessionManager.loading.check:invocation[0]": {
      type: "error.platform.sessionManager.loading.check:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
    "xstate.stop": { type: "xstate.stop" };
  };
  invokeSrcNameMap: {
    check: "done.invoke.sessionManager.loading.check:invocation[0]";
    dumpToken: "done.invoke.clearing:invocation[0]";
  };
  missingImplementations: {
    actions: "setCredentials";
    delays: never;
    guards: never;
    services: "check" | "dumpToken";
  };
  eventsCausingActions: {
    clearRefresh:
      | "done.invoke.client"
      | "done.invoke.guest"
      | "error.platform.client"
      | "error.platform.guest"
      | "xstate.stop";
    clearToken: "done.invoke.clearing:invocation[0]";
    setCredentials: "LOGIN";
    setError: "error.platform.client" | "error.platform.guest";
    setRefresh: "REFRESH";
    setToken:
      | "done.invoke.client"
      | "done.invoke.guest"
      | "done.invoke.sessionManager.loading.check:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    isClientToken: "done.invoke.sessionManager.loading.check:invocation[0]";
  };
  eventsCausingServices: {
    check:
      | "LOGIN"
      | "REFRESH"
      | "done.invoke.clearing:invocation[0]"
      | "xstate.init";
    client: "done.invoke.sessionManager.loading.check:invocation[0]";
    dumpToken: "KILL" | "LOGOUT";
    guest:
      | "done.invoke.sessionManager.loading.check:invocation[0]"
      | "error.platform.sessionManager.loading.check:invocation[0]";
  };
  matchesStates:
    | "clearing"
    | "complete"
    | "error"
    | "idle"
    | "idle.client"
    | "idle.guest"
    | "idle.none"
    | "loading"
    | "loading.check"
    | "loading.client"
    | "loading.guest"
    | {
        idle?: "client" | "guest" | "none";
        loading?: "check" | "client" | "guest";
      };
  tags: never;
}
