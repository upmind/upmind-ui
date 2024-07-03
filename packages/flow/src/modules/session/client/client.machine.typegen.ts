// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
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
    "done.invoke.sessionClient.transferring.initiating:invocation[0]": {
      type: "done.invoke.sessionClient.transferring.initiating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.loading:invocation[0]": {
      type: "error.platform.loading:invocation[0]";
      data: unknown;
    };
    "error.platform.refreshing:invocation[0]": {
      type: "error.platform.refreshing:invocation[0]";
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
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    load: "done.invoke.loading:invocation[0]";
    refreshToken: "done.invoke.refreshing:invocation[0]";
    transfer: "done.invoke.sessionClient.transferring.initiating:invocation[0]";
  };
  missingImplementations: {
    actions: "clearTransfer" | "setTransfer";
    delays: "expired";
    guards: never;
    services: "load" | "refreshToken" | "transfer";
  };
  eventsCausingActions: {
    clear: "LOGOUT";
    clearError:
      | "REFRESH"
      | "error.platform.refreshing:invocation[0]"
      | "xstate.init";
    clearTransfer: "xstate.after(expired)#sessionClient.transferring.available";
    setError:
      | "error.platform.loading:invocation[0]"
      | "error.platform.refreshing:invocation[0]"
      | "error.platform.sessionClient.transferring.initiating:invocation[0]";
    setTransfer: "done.invoke.sessionClient.transferring.initiating:invocation[0]";
    setUser: "done.invoke.loading:invocation[0]";
  };
  eventsCausingDelays: {
    error:
      | "error.platform.sessionClient.transferring.initiating:invocation[0]"
      | "xstate.after(expired)#sessionClient.transferring.available";
    expired: "done.invoke.sessionClient.transferring.initiating:invocation[0]";
    wait: "done.invoke.refreshing:invocation[0]";
  };
  eventsCausingGuards: {};
  eventsCausingServices: {
    load: "REFRESH" | "error.platform.refreshing:invocation[0]" | "xstate.init";
    refreshToken: "REFRESH";
    transfer: "TRANSFER";
  };
  matchesStates:
    | "complete"
    | "idle"
    | "loading"
    | "processed"
    | "refreshing"
    | "transferring"
    | "transferring.available"
    | "transferring.initiating"
    | "transferring.unavailable"
    | { transferring?: "available" | "initiating" | "unavailable" };
  tags: never;
}
