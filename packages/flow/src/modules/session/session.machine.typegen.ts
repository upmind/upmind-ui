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
    "done.invoke.sessionManager.starting.check:invocation[0]": {
      type: "done.invoke.sessionManager.starting.check:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.client": { type: "error.platform.client"; data: unknown };
    "error.platform.guest": { type: "error.platform.guest"; data: unknown };
    "error.platform.sessionManager.starting.check:invocation[0]": {
      type: "error.platform.sessionManager.starting.check:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    check: "done.invoke.sessionManager.starting.check:invocation[0]";
    dumpTokens: "done.invoke.clearing:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "check" | "dumpTokens";
  };
  eventsCausingActions: {
    clearError: "CANCEL" | "LOGIN" | "REGISTER" | "done.state.starting";
    clearRefresh: "done.state.starting";
    clearToken: "done.invoke.clearing:invocation[0]";
    setError: "error.platform.client" | "error.platform.guest";
    setRefresh: "REFRESH";
    setToken:
      | "done.invoke.client"
      | "done.invoke.guest"
      | "done.invoke.sessionManager.starting.check:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    isClientToken: "done.invoke.sessionManager.starting.check:invocation[0]";
  };
  eventsCausingServices: {
    check:
      | "CANCEL"
      | "LOGIN"
      | "REFRESH"
      | "REGISTER"
      | "done.invoke.clearing:invocation[0]"
      | "xstate.init";
    client:
      | "LOGIN"
      | "REGISTER"
      | "done.invoke.sessionManager.starting.check:invocation[0]";
    dumpTokens: "KILL" | "LOGOUT";
    guest:
      | "done.invoke.sessionManager.starting.check:invocation[0]"
      | "error.platform.sessionManager.starting.check:invocation[0]";
  };
  matchesStates:
    | "clearing"
    | "complete"
    | "idle"
    | "idle.client"
    | "idle.guest"
    | "idle.none"
    | "starting"
    | "starting.check"
    | "starting.client"
    | "starting.guest"
    | {
        idle?: "client" | "guest" | "none";
        starting?: "check" | "client" | "guest";
      };
  tags: never;
}
