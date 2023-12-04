// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {};
  missingImplementations: {
    actions: "cancel";
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    add: "ADD";
    cancel: "CANCEL";
    remove: "REMOVE";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    hasDomains: "";
    hasNoDomains: "";
  };
  eventsCausingServices: {};
  matchesStates: "complete" | "empty" | "processing";
  tags: never;
}
