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
    "done.invoke.placeManager.populating:invocation[0]": {
      type: "done.invoke.placeManager.populating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.placeManager.processing.adding:invocation[0]": {
      type: "done.invoke.placeManager.processing.adding:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.placeManager.processing.removing:invocation[0]": {
      type: "done.invoke.placeManager.processing.removing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.placeManager.processing.setting:invocation[0]": {
      type: "done.invoke.placeManager.processing.setting:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.placeManager.processing.updating:invocation[0]": {
      type: "done.invoke.placeManager.processing.updating:invocation[0]";
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
    "error.platform.placeManager.populating:invocation[0]": {
      type: "error.platform.placeManager.populating:invocation[0]";
      data: unknown;
    };
    "error.platform.placeManager.processing.adding:invocation[0]": {
      type: "error.platform.placeManager.processing.adding:invocation[0]";
      data: unknown;
    };
    "error.platform.placeManager.processing.removing:invocation[0]": {
      type: "error.platform.placeManager.processing.removing:invocation[0]";
      data: unknown;
    };
    "error.platform.placeManager.processing.setting:invocation[0]": {
      type: "error.platform.placeManager.processing.setting:invocation[0]";
      data: unknown;
    };
    "error.platform.placeManager.processing.updating:invocation[0]": {
      type: "error.platform.placeManager.processing.updating:invocation[0]";
      data: unknown;
    };
    "error.platform.placeManager.searching:invocation[0]": {
      type: "error.platform.placeManager.searching:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    add: "done.invoke.placeManager.processing.adding:invocation[0]";
    configureAutocomplete: "done.invoke.placeManager.loading.autocomplete.processing:invocation[0]";
    loadConstants: "done.invoke.placeManager.loading.constants.processing:invocation[0]";
    loadPlaceDetails: "done.invoke.placeManager.populating:invocation[0]";
    remove: "done.invoke.placeManager.processing.removing:invocation[0]";
    search: "done.invoke.placeManager.searching:invocation[0]";
    setDefault: "done.invoke.placeManager.processing.setting:invocation[0]";
    update: "done.invoke.placeManager.processing.updating:invocation[0]";
    validate: "done.invoke.checking:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services:
      | "add"
      | "configureAutocomplete"
      | "loadConstants"
      | "loadPlaceDetails"
      | "remove"
      | "search"
      | "setDefault"
      | "update"
      | "validate";
  };
  eventsCausingActions: {
    clearAutocomplete:
      | "done.invoke.placeManager.populating:invocation[0]"
      | "error.platform.placeManager.populating:invocation[0]";
    clearError:
      | "CLEAR"
      | "DEFAULT"
      | "REMOVE"
      | "RETRY"
      | "SEARCH"
      | "SET"
      | "UPDATE"
      | "done.invoke.placeManager.populating:invocation[0]"
      | "done.invoke.placeManager.searching:invocation[0]"
      | "done.state.placeManager.loading"
      | "error.platform.placeManager.searching:invocation[0]"
      | "xstate.init";
    clearModel:
      | "CLEAR"
      | "done.invoke.placeManager.processing.removing:invocation[0]";
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
      | "error.platform.placeManager.populating:invocation[0]"
      | "error.platform.placeManager.processing.adding:invocation[0]"
      | "error.platform.placeManager.processing.removing:invocation[0]"
      | "error.platform.placeManager.processing.setting:invocation[0]"
      | "error.platform.placeManager.processing.updating:invocation[0]"
      | "error.platform.placeManager.searching:invocation[0]";
    setModel:
      | "SET"
      | "done.invoke.placeManager.populating:invocation[0]"
      | "done.invoke.placeManager.processing.adding:invocation[0]"
      | "done.invoke.placeManager.processing.setting:invocation[0]"
      | "done.invoke.placeManager.processing.updating:invocation[0]";
    setSchemas:
      | "done.invoke.checking:invocation[0]"
      | "done.invoke.placeManager.processing.adding:invocation[0]"
      | "done.invoke.placeManager.processing.removing:invocation[0]"
      | "done.invoke.placeManager.processing.setting:invocation[0]"
      | "done.invoke.placeManager.processing.updating:invocation[0]"
      | "done.state.placeManager.loading"
      | "error.platform.checking:invocation[0]";
    setSearch: "SEARCH";
  };
  eventsCausingDelays: {
    wait:
      | "done.invoke.placeManager.processing.adding:invocation[0]"
      | "done.invoke.placeManager.processing.removing:invocation[0]"
      | "done.invoke.placeManager.processing.setting:invocation[0]"
      | "done.invoke.placeManager.processing.updating:invocation[0]";
  };
  eventsCausingGuards: {
    canRemove: "REMOVE";
    hasSelectedPlace: "SEARCH";
    isNew: "UPDATE";
    isNotDefault: "DEFAULT";
    isValidSearch: "SEARCH";
  };
  eventsCausingServices: {
    add: "UPDATE";
    configureAutocomplete:
      | "CLEAR"
      | "DEFAULT"
      | "REMOVE"
      | "SEARCH"
      | "SET"
      | "xstate.init";
    loadConstants:
      | "CLEAR"
      | "DEFAULT"
      | "REMOVE"
      | "SEARCH"
      | "SET"
      | "xstate.init";
    loadPlaceDetails: "SEARCH";
    remove: "REMOVE";
    search: "SEARCH";
    setDefault: "DEFAULT";
    update: "UPDATE";
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
    | "populating"
    | "processed"
    | "processing"
    | "processing.adding"
    | "processing.removing"
    | "processing.setting"
    | "processing.updating"
    | "searching"
    | "valid"
    | {
        loading?:
          | "autocomplete"
          | "constants"
          | {
              autocomplete?: "complete" | "error" | "processing";
              constants?: "complete" | "error" | "processing";
            };
        processing?: "adding" | "removing" | "setting" | "updating";
      };
  tags: never;
}
