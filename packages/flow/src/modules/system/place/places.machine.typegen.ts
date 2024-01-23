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
    loadPlaces: "done.invoke.placesManager.loading:invocation[0]";
  };
  missingImplementations: {
    actions: "clearError" | "setError";
    delays: never;
    guards: never;
    services: "loadPlaces";
  };
  eventsCausingActions: {
    add: "ADD";
    clearError:
      | "ADD"
      | "REFRESH"
      | "REMOVE"
      | "SELECT"
      | "STOP"
      | "xstate.init";
    clearPlaces:
      | "ADD"
      | "REFRESH"
      | "REMOVE"
      | "SELECT"
      | "STOP"
      | "xstate.init";
    clearSelected: "error.platform.placesManager.loading:invocation[0]";
    remove: "REMOVE";
    setError: "error.platform.placesManager.loading:invocation[0]";
    setPlaces: "done.invoke.placesManager.loading:invocation[0]";
    setSelected: "SELECT" | "done.invoke.placesManager.loading:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    hasNoPlaces: "";
    hasPlaces: "";
  };
  eventsCausingServices: {
    loadPlaces:
      | "ADD"
      | "REFRESH"
      | "REMOVE"
      | "SELECT"
      | "STOP"
      | "xstate.init";
  };
  matchesStates:
    | "available"
    | "complete"
    | "empty"
    | "error"
    | "loading"
    | "selected";
  tags: never;
}
