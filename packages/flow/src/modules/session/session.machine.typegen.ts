// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
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
    "done.invoke.loading:invocation[0]": {
      type: "done.invoke.loading:invocation[0]";
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
      | "done.invoke.client"
      | "done.invoke.guest"
      | "xstate.after(wait)#error";
    setToken: "AUTHENTICATED" | "done.invoke.loading:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    isClientToken: "done.invoke.loading:invocation[0]";
  };
  eventsCausingServices: {
    check:
      | "LOGIN"
      | "REFRESH"
      | "done.invoke.client"
      | "done.invoke.guest"
      | "xstate.init";
    client: "done.invoke.loading:invocation[0]";
    guest:
      | "KILL"
      | "LOGOUT"
      | "done.invoke.loading:invocation[0]"
      | "error.platform.loading:invocation[0]";
  };
  matchesStates:
    | "client"
    | "client.clearing"
    | "client.idle"
    | "client.loading"
    | "complete"
    | "error"
    | "guest"
    | "guest.clearing"
    | "guest.idle"
    | "guest.loading"
    | "loading"
    | {
        client?: "clearing" | "idle" | "loading";
        guest?: "clearing" | "idle" | "loading";
      };
  tags: never;
}
