// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.placeManager.loading:invocation[0]": {
      type: "done.invoke.placeManager.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.placeManager.processing:invocation[0]": {
      type: "done.invoke.placeManager.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.placeManager.searching:invocation[0]": {
      type: "done.invoke.placeManager.searching:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.placeManager.checking:invocation[0]": {
      type: "error.platform.placeManager.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.placeManager.loading:invocation[0]": {
      type: "error.platform.placeManager.loading:invocation[0]";
      data: unknown;
    };
    "error.platform.placeManager.processing:invocation[0]": {
      type: "error.platform.placeManager.processing:invocation[0]";
      data: unknown;
    };
    "error.platform.placeManager.searching:invocation[0]": {
      type: "error.platform.placeManager.searching:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#placeManager.processed": {
      type: "xstate.after(wait)#placeManager.processed";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    getPlace: "done.invoke.placeManager.loading:invocation[0]";
    search: "done.invoke.placeManager.searching:invocation[0]";
    update: "done.invoke.placeManager.processing:invocation[0]";
    validate: "done.invoke.placeManager.checking:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "getPlace" | "search" | "update" | "validate";
  };
  eventsCausingActions: {
    clearError:
      | "CLEAR"
      | "RETRY"
      | "SEARCH"
      | "SET"
      | "UPDATE"
      | "done.invoke.placeManager.searching:invocation[0]"
      | "xstate.init";
    clearModel: "CLEAR";
    setError:
      | "error.platform.placeManager.checking:invocation[0]"
      | "error.platform.placeManager.loading:invocation[0]"
      | "error.platform.placeManager.processing:invocation[0]"
      | "error.platform.placeManager.searching:invocation[0]";
    setModel:
      | "SET"
      | "done.invoke.placeManager.loading:invocation[0]"
      | "done.invoke.placeManager.processing:invocation[0]";
    setSchemas:
      | "done.invoke.placeManager.loading:invocation[0]"
      | "done.invoke.placeManager.processing:invocation[0]"
      | "done.invoke.placeManager.searching:invocation[0]";
  };
  eventsCausingDelays: {
    wait: "done.invoke.placeManager.processing:invocation[0]";
  };
  eventsCausingGuards: {};
  eventsCausingServices: {
    getPlace: "CLEAR" | "SEARCH" | "SET" | "UPDATE" | "xstate.init";
    search: "SEARCH";
    update: "RETRY" | "UPDATE";
    validate: "SET" | "done.invoke.placeManager.searching:invocation[0]";
  };
  matchesStates:
    | "checking"
    | "complete"
    | "error"
    | "idle"
    | "invalid"
    | "loading"
    | "processed"
    | "processing"
    | "searching"
    | "valid";
  tags: never;
}
