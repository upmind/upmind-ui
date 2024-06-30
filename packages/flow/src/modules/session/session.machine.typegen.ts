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
    "done.invoke.sessionManager.client.processing:invocation[0]": {
      type: "done.invoke.sessionManager.client.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.sessionManager.client.transferring.initiating:invocation[0]": {
      type: "done.invoke.sessionManager.client.transferring.initiating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.sessionManager.guest.processing:invocation[0]": {
      type: "done.invoke.sessionManager.guest.processing:invocation[0]";
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
    "error.platform.sessionManager.client.processing:invocation[0]": {
      type: "error.platform.sessionManager.client.processing:invocation[0]";
      data: unknown;
    };
    "error.platform.sessionManager.client.transferring.initiating:invocation[0]": {
      type: "error.platform.sessionManager.client.transferring.initiating:invocation[0]";
      data: unknown;
    };
    "error.platform.sessionManager.guest.processing:invocation[0]": {
      type: "error.platform.sessionManager.guest.processing:invocation[0]";
      data: unknown;
    };
    "error.platform.sessionManager.starting.check:invocation[0]": {
      type: "error.platform.sessionManager.starting.check:invocation[0]";
      data: unknown;
    };
    "xstate.after(error)#sessionManager.client.transferring.unavailable": {
      type: "xstate.after(error)#sessionManager.client.transferring.unavailable";
    };
    "xstate.after(expired)#sessionManager.client.transferring.available": {
      type: "xstate.after(expired)#sessionManager.client.transferring.available";
    };
    "xstate.after(wait)#sessionManager.guest.error": {
      type: "xstate.after(wait)#sessionManager.guest.error";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    check: "done.invoke.sessionManager.starting.check:invocation[0]";
    dumpTokens: "done.invoke.clearing:invocation[0]";
    getUser:
      | "done.invoke.sessionManager.client.processing:invocation[0]"
      | "done.invoke.sessionManager.guest.processing:invocation[0]";
    transfer: "done.invoke.sessionManager.client.transferring.initiating:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "check" | "dumpTokens" | "getUser" | "transfer";
  };
  eventsCausingActions: {
    clearError:
      | "CANCEL"
      | "CLEAR.ERRORS"
      | "LOGIN"
      | "REGISTER"
      | "done.state.starting";
    clearRefresh: "done.state.starting";
    clearToken: "done.invoke.clearing:invocation[0]";
    clearTransfer: "xstate.after(expired)#sessionManager.client.transferring.available";
    clearUser: "done.invoke.clearing:invocation[0]";
    setError:
      | "error.platform.client"
      | "error.platform.guest"
      | "error.platform.sessionManager.client.processing:invocation[0]"
      | "error.platform.sessionManager.client.transferring.initiating:invocation[0]"
      | "error.platform.sessionManager.guest.processing:invocation[0]";
    setHistory: "done.invoke.client";
    setRefresh: "REFRESH";
    setSuccess: "done.invoke.client";
    setToken:
      | "done.invoke.client"
      | "done.invoke.guest"
      | "done.invoke.sessionManager.starting.check:invocation[0]";
    setTransfer: "done.invoke.sessionManager.client.transferring.initiating:invocation[0]";
    setUser:
      | "done.invoke.sessionManager.client.processing:invocation[0]"
      | "done.invoke.sessionManager.guest.processing:invocation[0]";
  };
  eventsCausingDelays: {
    error:
      | "error.platform.sessionManager.client.transferring.initiating:invocation[0]"
      | "xstate.after(expired)#sessionManager.client.transferring.available";
    expired: "done.invoke.sessionManager.client.transferring.initiating:invocation[0]";
    wait: "error.platform.sessionManager.guest.processing:invocation[0]";
  };
  eventsCausingGuards: {
    hasNoUser: "";
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
    getUser: "" | "SELF";
    guest:
      | "done.invoke.sessionManager.starting.check:invocation[0]"
      | "error.platform.sessionManager.starting.check:invocation[0]";
    transfer: "TRANSFER";
  };
  matchesStates:
    | "clearing"
    | "client"
    | "client.error"
    | "client.idle"
    | "client.processing"
    | "client.transferring"
    | "client.transferring.available"
    | "client.transferring.initiating"
    | "client.transferring.unavailable"
    | "complete"
    | "guest"
    | "guest.error"
    | "guest.idle"
    | "guest.processing"
    | "starting"
    | "starting.check"
    | "starting.client"
    | "starting.guest"
    | {
        client?:
          | "error"
          | "idle"
          | "processing"
          | "transferring"
          | { transferring?: "available" | "initiating" | "unavailable" };
        guest?: "error" | "idle" | "processing";
        starting?: "check" | "client" | "guest";
      };
  tags: never;
}
