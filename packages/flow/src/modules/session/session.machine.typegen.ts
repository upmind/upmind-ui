// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.loading:invocation[0]": {
      type: "done.invoke.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.sessionManager.valid.client:invocation[0]": {
      type: "done.invoke.sessionManager.valid.client:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.sessionManager.valid.guest:invocation[0]": {
      type: "done.invoke.sessionManager.valid.guest:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.loading:invocation[0]": {
      type: "error.platform.loading:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#error": { type: "xstate.after(wait)#error" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    check: "done.invoke.loading:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "check";
  };
  eventsCausingActions: {
    clearToken:
      | "KILL"
      | "done.invoke.sessionManager.valid.client:invocation[0]"
      | "done.invoke.sessionManager.valid.guest:invocation[0]"
      | "xstate.after(wait)#error";
    setToken: "AUTHENTICATED" | "done.invoke.loading:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    isClientToken: "done.invoke.loading:invocation[0]";
  };
  eventsCausingServices: {
    check:
      | "done.invoke.sessionManager.valid.client:invocation[0]"
      | "done.invoke.sessionManager.valid.guest:invocation[0]"
      | "xstate.init";
  };
  matchesStates:
    | "complete"
    | "error"
    | "loading"
    | "valid"
    | "valid.client"
    | "valid.guest"
    | { valid?: "client" | "guest" };
  tags: never;
}
