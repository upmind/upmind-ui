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
    "error.platform.process": { type: "error.platform.process"; data: unknown };
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    add: "done.invoke.process";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "add";
  };
  eventsCausingActions: {
    clearError: "" | "ADD";
    sendRemoveMessage: "xstate.after(wait)#processed";
    setError: "error.platform.process";
    setProduct: "" | "ADD";
    setResponse: "done.invoke.process";
  };
  eventsCausingDelays: {
    wait: "done.invoke.process";
  };
  eventsCausingGuards: {
    hasProduct: "";
  };
  eventsCausingServices: {
    add: "" | "ADD";
  };
  matchesStates:
    | "available"
    | "complete"
    | "error"
    | "processed"
    | "processing";
  tags: never;
}
