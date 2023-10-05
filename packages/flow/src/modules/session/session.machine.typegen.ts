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
    "done.invoke.sessionManager.loading.role.check:invocation[0]": {
      type: "done.invoke.sessionManager.loading.role.check:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.client": { type: "error.platform.client"; data: unknown };
    "error.platform.guest": { type: "error.platform.guest"; data: unknown };
    "error.platform.sessionManager.loading.role.check:invocation[0]": {
      type: "error.platform.sessionManager.loading.role.check:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    check: "done.invoke.sessionManager.loading.role.check:invocation[0]";
    dumpTokens: "done.invoke.clearing:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "check" | "dumpTokens";
  };
  eventsCausingActions: {
    clearError: "SWAP" | "done.state.role";
    clearMessage:
      | "SWAP"
      | "done.state.role"
      | "error.platform.client"
      | "error.platform.guest";
    clearRefresh: "done.state.role";
    clearToken: "done.invoke.clearing:invocation[0]";
    setError: "error.platform.client" | "error.platform.guest";
    setMessage: "MESSAGE";
    setRefresh: "REFRESH";
    setToken:
      | "done.invoke.client"
      | "done.invoke.guest"
      | "done.invoke.sessionManager.loading.role.check:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    hasError: "";
    hasMessage: "";
    hasNoError: "";
    hasNoMessage: "";
    isClientRole: "SWAP";
    isClientToken: "done.invoke.sessionManager.loading.role.check:invocation[0]";
    isGuestRole: "SWAP";
  };
  eventsCausingServices: {
    check:
      | "REFRESH"
      | "SWAP"
      | "done.invoke.clearing:invocation[0]"
      | "xstate.init";
    client:
      | "SWAP"
      | "done.invoke.sessionManager.loading.role.check:invocation[0]";
    dumpTokens: "KILL" | "LOGOUT";
    guest:
      | "SWAP"
      | "done.invoke.sessionManager.loading.role.check:invocation[0]"
      | "error.platform.sessionManager.loading.role.check:invocation[0]";
  };
  matchesStates:
    | "clearing"
    | "complete"
    | "idle"
    | "idle.client"
    | "idle.guest"
    | "idle.none"
    | "loading"
    | "loading.role"
    | "loading.role.check"
    | "loading.role.client"
    | "loading.role.guest"
    | "loading.status"
    | "loading.status.error"
    | "loading.status.processing"
    | "loading.status.waiting"
    | {
        idle?: "client" | "guest" | "none";
        loading?:
          | "role"
          | "status"
          | {
              role?: "check" | "client" | "guest";
              status?: "error" | "processing" | "waiting";
            };
      };
  tags: never;
}
