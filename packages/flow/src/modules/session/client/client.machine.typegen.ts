// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.sessionClient.processing:invocation[0]": {
      type: "done.invoke.sessionClient.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.sessionClient.transferring.initiating:invocation[0]": {
      type: "done.invoke.sessionClient.transferring.initiating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.sessionClient.processing:invocation[0]": {
      type: "error.platform.sessionClient.processing:invocation[0]";
      data: unknown;
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
    check: "done.invoke.loading:invocation[0]";
    getUser: "done.invoke.sessionClient.processing:invocation[0]";
    transfer: "done.invoke.sessionClient.transferring.initiating:invocation[0]";
  };
  missingImplementations: {
    actions: "clearTransfer" | "setTransfer";
    delays: "expired";
    guards: "hasNoUser";
    services: "check" | "getUser" | "transfer";
  };
  eventsCausingActions: {
    clear: "LOGOUT";
    clearError: "xstate.init";
    clearTransfer: "xstate.after(expired)#sessionClient.transferring.available";
    setError:
      | "error.platform.sessionClient.processing:invocation[0]"
      | "error.platform.sessionClient.transferring.initiating:invocation[0]";
    setTransfer: "done.invoke.sessionClient.transferring.initiating:invocation[0]";
    setUser: "done.invoke.sessionClient.processing:invocation[0]";
  };
  eventsCausingDelays: {
    error:
      | "error.platform.sessionClient.transferring.initiating:invocation[0]"
      | "xstate.after(expired)#sessionClient.transferring.available";
    expired: "done.invoke.sessionClient.transferring.initiating:invocation[0]";
  };
  eventsCausingGuards: {
    hasNoUser: "";
  };
  eventsCausingServices: {
    check: "xstate.init";
    getUser: "";
    transfer: "TRANSFER";
  };
  matchesStates:
    | "complete"
    | "error"
    | "idle"
    | "loading"
    | "processing"
    | "transferring"
    | "transferring.available"
    | "transferring.initiating"
    | "transferring.unavailable"
    | { transferring?: "available" | "initiating" | "unavailable" };
  tags: never;
}
