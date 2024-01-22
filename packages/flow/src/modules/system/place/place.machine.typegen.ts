// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.placeManager.checking:invocation[0]": {
      type: "done.invoke.placeManager.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.placeManager.loading.constants:invocation[0]": {
      type: "done.invoke.placeManager.loading.constants:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.placeManager.loading.place:invocation[0]": {
      type: "done.invoke.placeManager.loading.place:invocation[0]";
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
    "error.platform.placeManager.loading.constants:invocation[0]": {
      type: "error.platform.placeManager.loading.constants:invocation[0]";
      data: unknown;
    };
    "error.platform.placeManager.loading.place:invocation[0]": {
      type: "error.platform.placeManager.loading.place:invocation[0]";
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
    load: "done.invoke.placeManager.loading.place:invocation[0]";
    loadConstants: "done.invoke.placeManager.loading.constants:invocation[0]";
    save: "done.invoke.placeManager.processing:invocation[0]";
    search: "done.invoke.placeManager.searching:invocation[0]";
    validate: "done.invoke.placeManager.checking:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "load" | "loadConstants" | "save" | "search" | "validate";
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
    refresh:
      | "done.invoke.placeManager.checking:invocation[0]"
      | "error.platform.placeManager.checking:invocation[0]";
    setConstants: "done.invoke.placeManager.loading.constants:invocation[0]";
    setError:
      | "error.platform.placeManager.checking:invocation[0]"
      | "error.platform.placeManager.loading.constants:invocation[0]"
      | "error.platform.placeManager.loading.place:invocation[0]"
      | "error.platform.placeManager.processing:invocation[0]"
      | "error.platform.placeManager.searching:invocation[0]";
    setModel:
      | "done.invoke.placeManager.loading.place:invocation[0]"
      | "done.invoke.placeManager.processing:invocation[0]";
    setSchemas:
      | "done.invoke.placeManager.checking:invocation[0]"
      | "done.invoke.placeManager.loading.place:invocation[0]"
      | "done.invoke.placeManager.processing:invocation[0]"
      | "done.invoke.placeManager.searching:invocation[0]"
      | "error.platform.placeManager.checking:invocation[0]";
  };
  eventsCausingDelays: {
    wait: "done.invoke.placeManager.processing:invocation[0]";
  };
  eventsCausingGuards: {};
  eventsCausingServices: {
    load: "done.invoke.placeManager.loading.constants:invocation[0]";
    loadConstants: "CLEAR" | "SEARCH" | "SET" | "UPDATE" | "xstate.init";
    save: "RETRY" | "UPDATE";
    search: "SEARCH";
    validate: "SET" | "done.invoke.placeManager.searching:invocation[0]";
  };
  matchesStates:
    | "checking"
    | "complete"
    | "error"
    | "idle"
    | "invalid"
    | "loading"
    | "loading.constants"
    | "loading.place"
    | "processed"
    | "processing"
    | "searching"
    | "valid"
    | { loading?: "constants" | "place" };
  tags: never;
}
