// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.clientMachine": {
      type: "done.invoke.clientMachine";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.guestMachine": {
      type: "done.invoke.guestMachine";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.refreshing:invocation[0]": {
      type: "done.invoke.refreshing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.sessionManager.checking.check:invocation[0]": {
      type: "done.invoke.sessionManager.checking.check:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.refreshing:invocation[0]": {
      type: "error.platform.refreshing:invocation[0]";
      data: unknown;
    };
    "error.platform.sessionManager.checking.check:invocation[0]": {
      type: "error.platform.sessionManager.checking.check:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    check: "done.invoke.sessionManager.checking.check:invocation[0]";
    refreshToken: "done.invoke.refreshing:invocation[0]";
  };
  missingImplementations: {
    actions: "clearRefresh";
    delays: never;
    guards: never;
    services: "check" | "refreshToken";
  };
  eventsCausingActions: {
    clear:
      | "error.platform.refreshing:invocation[0]"
      | "error.platform.sessionManager.checking.check:invocation[0]";
    clearError: "CANCEL" | "CLEAR.ERRORS" | "done.state.checking";
    clearRefresh: "done.state.checking";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    isClientToken:
      | "done.invoke.refreshing:invocation[0]"
      | "done.invoke.sessionManager.checking.check:invocation[0]";
  };
  eventsCausingServices: {
    check:
      | "CANCEL"
      | "done.invoke.clientMachine"
      | "done.invoke.guestMachine"
      | "xstate.init";
    clientMachine:
      | "done.invoke.refreshing:invocation[0]"
      | "done.invoke.sessionManager.checking.check:invocation[0]";
    guestMachine:
      | "done.invoke.refreshing:invocation[0]"
      | "done.invoke.sessionManager.checking.check:invocation[0]"
      | "error.platform.refreshing:invocation[0]"
      | "error.platform.sessionManager.checking.check:invocation[0]";
    refreshToken: never;
  };
  matchesStates:
    | "checking"
    | "checking.check"
    | "client"
    | "complete"
    | "guest"
    | "refreshing"
    | "unavailable"
    | { checking?: "check" };
  tags: never;
}
