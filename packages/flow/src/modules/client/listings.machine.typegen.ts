// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.clientListingsManager.loading:invocation[0]": {
      type: "done.invoke.clientListingsManager.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.clientListingsManager.loading:invocation[0]": {
      type: "error.platform.clientListingsManager.loading:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    load: "done.invoke.clientListingsManager.loading:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "load";
  };
  eventsCausingActions: {
    add: "ADD";
    clearError: "ADD" | "EDIT" | "REFRESH" | "STOP" | "xstate.init";
    clearItems: "ADD" | "EDIT" | "REFRESH" | "STOP" | "xstate.init";
    clearSelected: "error.platform.clientListingsManager.loading:invocation[0]";
    setError: "error.platform.clientListingsManager.loading:invocation[0]";
    setInitial:
      | "REFRESH"
      | "done.invoke.clientListingsManager.loading:invocation[0]";
    setItems: "done.invoke.clientListingsManager.loading:invocation[0]";
    setSelected: "EDIT" | "SELECT";
    setSelectedNew: "ADD";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    hasItems: "";
    hasNoItems: "";
    hasSelected: "";
    isSelectable: "SELECT";
  };
  eventsCausingServices: {
    load: "ADD" | "EDIT" | "REFRESH" | "STOP" | "xstate.init";
  };
  matchesStates:
    | "available"
    | "complete"
    | "editing"
    | "empty"
    | "error"
    | "loading"
    | "selected";
  tags: never;
}
