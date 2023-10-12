// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.updating:invocation[0]": {
      type: "done.invoke.updating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.updating:invocation[0]": {
      type: "error.platform.updating:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    dump: "done.invoke.clearing:invocation[0]";
    update: "done.invoke.updating:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "dump" | "update";
  };
  eventsCausingActions: {
    clearError: "UPDATE";
    clearModel: "done.invoke.updating:invocation[0]";
    setError: "error.platform.updating:invocation[0]";
    setModel: "UPDATE";
    setResponse: "done.invoke.updating:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    needsConfiguring: "";
  };
  eventsCausingServices: {
    dump: "REMOVE";
    update: "UPDATE";
  };
  matchesStates:
    | "clearing"
    | "complete"
    | "configuring"
    | "error"
    | "idle"
    | "updating";
  tags: never;
}
