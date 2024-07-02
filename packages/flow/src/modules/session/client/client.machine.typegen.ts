// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.client.processing:invocation[0]": {
      type: "done.invoke.client.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.client.transferring.initiating:invocation[0]": {
      type: "done.invoke.client.transferring.initiating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.client.processing:invocation[0]": {
      type: "error.platform.client.processing:invocation[0]";
      data: unknown;
    };
    "error.platform.client.transferring.initiating:invocation[0]": {
      type: "error.platform.client.transferring.initiating:invocation[0]";
      data: unknown;
    };
    "xstate.after(error)#client.transferring.unavailable": {
      type: "xstate.after(error)#client.transferring.unavailable";
    };
    "xstate.after(expired)#client.transferring.available": {
      type: "xstate.after(expired)#client.transferring.available";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    check: "done.invoke.loading:invocation[0]";
    getUser: "done.invoke.client.processing:invocation[0]";
    transfer: "done.invoke.client.transferring.initiating:invocation[0]";
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
    clearTransfer: "xstate.after(expired)#client.transferring.available";
    setError:
      | "error.platform.client.processing:invocation[0]"
      | "error.platform.client.transferring.initiating:invocation[0]";
    setTransfer: "done.invoke.client.transferring.initiating:invocation[0]";
    setUser: "done.invoke.client.processing:invocation[0]";
  };
  eventsCausingDelays: {
    error:
      | "error.platform.client.transferring.initiating:invocation[0]"
      | "xstate.after(expired)#client.transferring.available";
    expired: "done.invoke.client.transferring.initiating:invocation[0]";
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
