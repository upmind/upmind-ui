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
    "done.invoke.sessionManager.checking:invocation[0]": {
      type: "done.invoke.sessionManager.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.sessionManager.checking:invocation[0]": {
      type: "error.platform.sessionManager.checking:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    check: "done.invoke.sessionManager.checking:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "check";
  };
  eventsCausingActions: {};
  eventsCausingDelays: {};
  eventsCausingGuards: {
    isClientToken: "done.invoke.sessionManager.checking:invocation[0]";
  };
  eventsCausingServices: {
    check: "xstate.init";
    clientMachine:
      | "done.invoke.guestMachine"
      | "done.invoke.sessionManager.checking:invocation[0]";
    guestMachine:
      | "done.invoke.clientMachine"
      | "done.invoke.sessionManager.checking:invocation[0]"
      | "error.platform.sessionManager.checking:invocation[0]";
  };
  matchesStates: "checking" | "client" | "complete" | "guest" | "unavailable";
  tags: never;
}
