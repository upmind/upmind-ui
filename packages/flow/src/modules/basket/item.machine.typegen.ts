// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.process": {
      type: "done.invoke.process";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.updating:invocation[0]": {
      type: "done.invoke.updating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.process": { type: "error.platform.process"; data: unknown };
    "error.platform.updating:invocation[0]": {
      type: "error.platform.updating:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    add: "done.invoke.process";
    dump: "done.invoke.clearing:invocation[0]";
    update: "done.invoke.updating:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "add" | "dump" | "update";
  };
  eventsCausingActions: {
    clearError: "UPDATE";
    clearModel: "done.invoke.updating:invocation[0]";
    setError:
      | "error.platform.process"
      | "error.platform.updating:invocation[0]";
    setModel: "UPDATE";
    setResponse: "done.invoke.process" | "done.invoke.updating:invocation[0]";
  };
  eventsCausingDelays: {
    wait: "done.invoke.process";
  };
  eventsCausingGuards: {
    needsConfiguring: "";
  };
  eventsCausingServices: {
    add: never;
    dump: "REMOVE";
    update: "UPDATE";
  };
  matchesStates:
    | "clearing"
    | "complete"
    | "configuring"
    | "error"
    | "idle"
    | "processed"
    | "processing"
    | "updating";
  tags: never;
}
