// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.cancel": {
      type: "done.invoke.cancel";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.process": {
      type: "done.invoke.process";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.cancel": { type: "error.platform.cancel"; data: unknown };
    "error.platform.process": { type: "error.platform.process"; data: unknown };
    "xstate.after(100)#request.processed": {
      type: "xstate.after(100)#request.processed";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    cancelRequest: "done.invoke.cancel";
    generateRequest: "done.invoke.process";
    useRequest: "done.invoke.process";
  };
  missingImplementations: {
    actions:
      | "clearError"
      | "clearRequestPromise"
      | "setError"
      | "setPromise"
      | "setResponse";
    delays: never;
    guards: "isBeforeNoon";
    services: "cancelRequest" | "generateRequest" | "useRequest";
  };
  eventsCausingActions: {
    clearError: "RETRY";
    clearRequestPromise: "CANCEL" | "xstate.after(100)#request.processed";
    setError: "error.platform.cancel" | "error.platform.process";
    setPromise: "done.invoke.process";
    setResponse: "done.invoke.process";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    isBeforeNoon: "";
  };
  eventsCausingServices: {
    cancelRequest: "CANCEL";
    generateRequest: "" | "DELETE" | "GET" | "PATCH" | "POST" | "PUT";
    useRequest: "" | "RETRY" | "done.invoke.process";
  };
  matchesStates:
    | "cancelling"
    | "complete"
    | "error"
    | "generating"
    | "idle"
    | "processed"
    | "processing";
  tags: never;
}
