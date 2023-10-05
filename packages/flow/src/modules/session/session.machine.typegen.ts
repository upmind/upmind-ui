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
    dumpTokens: "done.invoke.clearing:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "check" | "dumpTokens";
  };
  eventsCausingActions: {
    clearRefresh:
      | "done.invoke.client"
      | "done.invoke.guest"
      | "error.platform.client"
      | "error.platform.guest"
      | "xstate.stop";
    clearToken: "done.invoke.clearing:invocation[0]";
    setError: "error.platform.client" | "error.platform.guest";
    setRefresh: "REFRESH";
    setToken:
      | "done.invoke.client"
      | "done.invoke.guest"
      | "done.invoke.sessionManager.loading.check:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    isClientRole: "SWAP";
    isClientToken: "done.invoke.sessionManager.loading.check:invocation[0]";
    isGuestRole: "SWAP";
  };
  eventsCausingServices: {
    check:
      | "REFRESH"
      | "SWAP"
      | "done.invoke.clearing:invocation[0]"
      | "xstate.init";
    client: "SWAP" | "done.invoke.sessionManager.loading.check:invocation[0]";
    dumpTokens: "KILL" | "LOGOUT";
    guest:
      | "SWAP"
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
