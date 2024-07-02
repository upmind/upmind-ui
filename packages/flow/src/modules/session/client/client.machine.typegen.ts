// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.loading:invocation[0]": {
      type: "done.invoke.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.sessionClient.transferring.initiating:invocation[0]": {
      type: "done.invoke.sessionClient.transferring.initiating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.sessionClient.transferring.initiating:invocation[0]": {
      type: "error.platform.sessionClient.transferring.initiating:invocation[0]";
      data: unknown;
    };
    "xstate.after(error)#sessionClient.transferring.unavailable": {
      type: "xstate.after(error)#sessionClient.transferring.unavailable";
    };
    "xstate.after(expired)#sessionClient.transferring.available": {
      type: "xstate.after(expired)#sessionClient.transferring.available";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    load: "done.invoke.loading:invocation[0]";
    transfer: "done.invoke.sessionClient.transferring.initiating:invocation[0]";
  };
  missingImplementations: {
    actions: "clearTransfer" | "setTransfer";
    delays: "expired";
    guards: never;
    services: "load" | "transfer";
  };
  eventsCausingActions: {
    clear: "LOGOUT";
    clearError: "xstate.init";
    clearTransfer: "xstate.after(expired)#sessionClient.transferring.available";
    setError: "error.platform.sessionClient.transferring.initiating:invocation[0]";
    setTransfer: "done.invoke.sessionClient.transferring.initiating:invocation[0]";
    setUser: "done.invoke.loading:invocation[0]";
  };
  eventsCausingDelays: {
    error:
      | "error.platform.sessionClient.transferring.initiating:invocation[0]"
      | "xstate.after(expired)#sessionClient.transferring.available";
    expired: "done.invoke.sessionClient.transferring.initiating:invocation[0]";
  };
  eventsCausingGuards: {};
  eventsCausingServices: {
    load: "xstate.init";
    transfer: "TRANSFER";
  };
  matchesStates:
    | "complete"
    | "error"
    | "idle"
    | "loading"
    | "transferring"
    | "transferring.available"
    | "transferring.initiating"
    | "transferring.unavailable"
    | { transferring?: "available" | "initiating" | "unavailable" };
  tags: never;
}
