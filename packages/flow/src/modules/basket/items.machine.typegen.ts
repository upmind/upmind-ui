// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {};
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    remove: "REMOVE";
    spawnItems: "xstate.init";
    update: "UPDATE";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    allConfigured: "";
    hasItems: "";
    hasNoItems: "";
    someConfiguring: "";
  };
  eventsCausingServices: {};
  matchesStates: "configured" | "configuring" | "empty" | "error" | "loading";
  tags: never;
}
