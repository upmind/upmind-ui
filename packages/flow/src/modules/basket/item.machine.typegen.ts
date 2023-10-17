// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.item.configuring:invocation[0]": {
      type: "done.invoke.item.configuring:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.item.processing:invocation[0]": {
      type: "done.invoke.item.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.item.processing:invocation[0]": {
      type: "error.platform.item.processing:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    add: "done.invoke.item.processing:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "add";
  };
  eventsCausingActions: {
    clearError: "done.invoke.item.configuring:invocation[0]";
    setConfig: "done.invoke.item.configuring:invocation[0]";
    setError: "error.platform.item.processing:invocation[0]";
    setResponse: "done.invoke.item.processing:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {
    add: "done.invoke.item.configuring:invocation[0]";
  };
  matchesStates: "complete" | "configuring" | "error" | "processing";
  tags: never;
}
