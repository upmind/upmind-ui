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
    add: "ADD";
    dumpStale: "ADD" | "DUMP";
    forward: "CANCEL" | "RETRY";
    remove: "REMOVE";
    stash: "STASH";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    hasRequests: "";
  };
  eventsCausingServices: {};
  matchesStates: "active" | "complete" | "idle";
  tags: never;
}
