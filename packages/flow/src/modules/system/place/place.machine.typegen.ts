// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.checking:invocation[0]": {
      type: "done.invoke.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.placeManager.loading.autocomplete.processing:invocation[0]": {
      type: "done.invoke.placeManager.loading.autocomplete.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.placeManager.loading.constants.processing:invocation[0]": {
      type: "done.invoke.placeManager.loading.constants.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.placeManager.loading.place.processing:invocation[0]": {
      type: "done.invoke.placeManager.loading.place.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.placeManager.populating:invocation[0]": {
      type: "done.invoke.placeManager.populating:invocation[0]";
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
    "error.platform.checking:invocation[0]": {
      type: "error.platform.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.placeManager.loading.autocomplete.processing:invocation[0]": {
      type: "error.platform.placeManager.loading.autocomplete.processing:invocation[0]";
      data: unknown;
    };
    "error.platform.placeManager.loading.constants.processing:invocation[0]": {
      type: "error.platform.placeManager.loading.constants.processing:invocation[0]";
      data: unknown;
    };
    "error.platform.placeManager.loading.place.processing:invocation[0]": {
      type: "error.platform.placeManager.loading.place.processing:invocation[0]";
      data: unknown;
    };
    "error.platform.placeManager.populating:invocation[0]": {
      type: "error.platform.placeManager.populating:invocation[0]";
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
    configureAutocomplete: "done.invoke.placeManager.loading.autocomplete.processing:invocation[0]";
    load: "done.invoke.placeManager.loading.place.processing:invocation[0]";
    loadConstants: "done.invoke.placeManager.loading.constants.processing:invocation[0]";
    loadPlaceDetails: "done.invoke.placeManager.populating:invocation[0]";
    save: "done.invoke.placeManager.processing:invocation[0]";
    search: "done.invoke.placeManager.searching:invocation[0]";
    validate: "done.invoke.checking:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services:
      | "configureAutocomplete"
      | "load"
      | "loadConstants"
      | "loadPlaceDetails"
      | "save"
      | "search"
      | "validate";
  };
  eventsCausingActions: {
    clearAutocomplete:
      | "done.invoke.placeManager.populating:invocation[0]"
      | "error.platform.placeManager.populating:invocation[0]";
    clearError:
      | "CLEAR"
      | "RETRY"
      | "SEARCH"
      | "SET"
      | "UPDATE"
      | "done.invoke.placeManager.populating:invocation[0]"
      | "done.invoke.placeManager.searching:invocation[0]"
      | "done.state.placeManager.loading"
      | "error.platform.placeManager.searching:invocation[0]"
      | "xstate.init";
    clearModel: "CLEAR";
    refresh:
      | "done.invoke.checking:invocation[0]"
      | "error.platform.checking:invocation[0]";
    setAutocomplete:
      | "done.invoke.placeManager.loading.autocomplete.processing:invocation[0]"
      | "done.invoke.placeManager.searching:invocation[0]";
    setConstants: "done.invoke.placeManager.loading.constants.processing:invocation[0]";
    setError:
      | "error.platform.placeManager.loading.autocomplete.processing:invocation[0]"
      | "error.platform.placeManager.loading.constants.processing:invocation[0]"
      | "error.platform.placeManager.loading.place.processing:invocation[0]"
      | "error.platform.placeManager.populating:invocation[0]"
      | "error.platform.placeManager.processing:invocation[0]"
      | "error.platform.placeManager.searching:invocation[0]";
    setModel:
      | "SET"
      | "done.invoke.placeManager.loading.place.processing:invocation[0]"
      | "done.invoke.placeManager.populating:invocation[0]"
      | "done.invoke.placeManager.processing:invocation[0]";
    setSchemas:
      | "done.invoke.checking:invocation[0]"
      | "done.invoke.placeManager.processing:invocation[0]"
      | "done.state.placeManager.loading"
      | "error.platform.checking:invocation[0]";
    setSearch: "SEARCH";
  };
  eventsCausingDelays: {
    wait: "done.invoke.placeManager.processing:invocation[0]";
  };
  eventsCausingGuards: {
    hasSelectedPlace: "SEARCH";
    isValidSearch: "SEARCH";
  };
  eventsCausingServices: {
    configureAutocomplete:
      | "CLEAR"
      | "SEARCH"
      | "SET"
      | "UPDATE"
      | "xstate.init";
    load: "CLEAR" | "SEARCH" | "SET" | "UPDATE" | "xstate.init";
    loadConstants: "CLEAR" | "SEARCH" | "SET" | "UPDATE" | "xstate.init";
    loadPlaceDetails: "SEARCH";
    save: "RETRY" | "UPDATE";
    search: "SEARCH";
    validate:
      | "SET"
      | "done.invoke.placeManager.populating:invocation[0]"
      | "done.invoke.placeManager.searching:invocation[0]"
      | "done.state.placeManager.loading"
      | "error.platform.placeManager.searching:invocation[0]";
  };
  matchesStates:
    | "checking"
    | "complete"
    | "error"
    | "invalid"
    | "loading"
    | "loading.autocomplete"
    | "loading.autocomplete.complete"
    | "loading.autocomplete.error"
    | "loading.autocomplete.processing"
    | "loading.constants"
    | "loading.constants.complete"
    | "loading.constants.error"
    | "loading.constants.processing"
    | "loading.place"
    | "loading.place.complete"
    | "loading.place.error"
    | "loading.place.processing"
    | "populating"
    | "processed"
    | "processing"
    | "searching"
    | "valid"
    | {
        loading?:
          | "autocomplete"
          | "constants"
          | "place"
          | {
              autocomplete?: "complete" | "error" | "processing";
              constants?: "complete" | "error" | "processing";
              place?: "complete" | "error" | "processing";
            };
      };
  tags: never;
}
