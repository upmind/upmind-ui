// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.generating:invocation[0]": {
      type: "done.invoke.generating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    create: "done.invoke.generating:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "create";
  };
  eventsCausingActions: {
    add: "ADD";
    load: "" | "done.invoke.generating:invocation[0]";
    remove: "*" | "REMOVE";
    sendBasket: "*" | "done.invoke.generating:invocation[0]";
    setBasket: "done.invoke.generating:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    allConfigured: "";
    hasItems: "";
    hasNoBasket: "";
  };
  eventsCausingServices: {
    create: "";
  };
  matchesStates:
    | "complete"
    | "configuring"
    | "empty"
    | "error"
    | "generating"
    | "loading";
  tags: never;
}
