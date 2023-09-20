// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {};
  missingImplementations: {
    actions: "add" | "forward" | "remove";
    delays: never;
    guards: never;
    services: never;
  };
  eventsCausingActions: {
    add: "ADD";
    forward: "CANCEL" | "RETRY";
    remove: "REMOVE";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {};
  matchesStates: "active" | "complete" | "idle";
  tags: never;
}
