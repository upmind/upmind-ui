// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.placesManager.loading:invocation[0]": {
      type: "done.invoke.placesManager.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.placesManager.loading:invocation[0]": {
      type: "error.platform.placesManager.loading:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    load: "done.invoke.placesManager.loading:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "load";
  };
  eventsCausingActions: {
    add: "ADD";
    clearError: "ADD" | "EDIT" | "REFRESH" | "SELECT" | "STOP" | "xstate.init";
    clearItems: "ADD" | "EDIT" | "REFRESH" | "SELECT" | "STOP" | "xstate.init";
    clearSelected: "error.platform.placesManager.loading:invocation[0]";
    setError: "error.platform.placesManager.loading:invocation[0]";
    setItems: "done.invoke.placesManager.loading:invocation[0]";
    setSelected:
      | "EDIT"
      | "SELECT"
      | "done.invoke.placesManager.loading:invocation[0]";
    setSelectedNew: "ADD";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    hasItems: "";
    hasNoItems: "";
    isSelectable: "SELECT";
  };
  eventsCausingServices: {
    load: "ADD" | "EDIT" | "REFRESH" | "SELECT" | "STOP" | "xstate.init";
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
