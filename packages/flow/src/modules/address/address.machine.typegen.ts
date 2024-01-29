// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.addressManager.loading.autocomplete.processing:invocation[0]": {
      type: "done.invoke.addressManager.loading.autocomplete.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.addressManager.loading.constants.processing:invocation[0]": {
      type: "done.invoke.addressManager.loading.constants.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.addressManager.populating:invocation[0]": {
      type: "done.invoke.addressManager.populating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.addressManager.processing.adding:invocation[0]": {
      type: "done.invoke.addressManager.processing.adding:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.addressManager.processing.removing:invocation[0]": {
      type: "done.invoke.addressManager.processing.removing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.addressManager.processing.setting:invocation[0]": {
      type: "done.invoke.addressManager.processing.setting:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.addressManager.processing.updating:invocation[0]": {
      type: "done.invoke.addressManager.processing.updating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.addressManager.searching:invocation[0]": {
      type: "done.invoke.addressManager.searching:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.checking:invocation[0]": {
      type: "done.invoke.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.addressManager.loading.autocomplete.processing:invocation[0]": {
      type: "error.platform.addressManager.loading.autocomplete.processing:invocation[0]";
      data: unknown;
    };
    "error.platform.addressManager.loading.constants.processing:invocation[0]": {
      type: "error.platform.addressManager.loading.constants.processing:invocation[0]";
      data: unknown;
    };
    "error.platform.addressManager.populating:invocation[0]": {
      type: "error.platform.addressManager.populating:invocation[0]";
      data: unknown;
    };
    "error.platform.addressManager.processing.adding:invocation[0]": {
      type: "error.platform.addressManager.processing.adding:invocation[0]";
      data: unknown;
    };
    "error.platform.addressManager.processing.removing:invocation[0]": {
      type: "error.platform.addressManager.processing.removing:invocation[0]";
      data: unknown;
    };
    "error.platform.addressManager.processing.setting:invocation[0]": {
      type: "error.platform.addressManager.processing.setting:invocation[0]";
      data: unknown;
    };
    "error.platform.addressManager.processing.updating:invocation[0]": {
      type: "error.platform.addressManager.processing.updating:invocation[0]";
      data: unknown;
    };
    "error.platform.addressManager.searching:invocation[0]": {
      type: "error.platform.addressManager.searching:invocation[0]";
      data: unknown;
    };
    "error.platform.checking:invocation[0]": {
      type: "error.platform.checking:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    add: "done.invoke.addressManager.processing.adding:invocation[0]";
    configureAutocomplete: "done.invoke.addressManager.loading.autocomplete.processing:invocation[0]";
    loadAddressDetails: "done.invoke.addressManager.populating:invocation[0]";
    loadConstants: "done.invoke.addressManager.loading.constants.processing:invocation[0]";
    remove: "done.invoke.addressManager.processing.removing:invocation[0]";
    search: "done.invoke.addressManager.searching:invocation[0]";
    setDefault: "done.invoke.addressManager.processing.setting:invocation[0]";
    update: "done.invoke.addressManager.processing.updating:invocation[0]";
    validate: "done.invoke.checking:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services:
      | "add"
      | "configureAutocomplete"
      | "loadAddressDetails"
      | "loadConstants"
      | "remove"
      | "search"
      | "setDefault"
      | "update"
      | "validate";
  };
  eventsCausingActions: {
    clearAutocomplete:
      | "done.invoke.addressManager.populating:invocation[0]"
      | "error.platform.addressManager.populating:invocation[0]";
    clearError:
      | "CLEAR"
      | "DEFAULT"
      | "REMOVE"
      | "RETRY"
      | "SEARCH"
      | "SET"
      | "UPDATE"
      | "done.invoke.addressManager.populating:invocation[0]"
      | "done.invoke.addressManager.searching:invocation[0]"
      | "done.state.addressManager.loading"
      | "error.platform.addressManager.searching:invocation[0]"
      | "xstate.init";
    clearModel:
      | "CLEAR"
      | "done.invoke.addressManager.processing.removing:invocation[0]";
    refresh:
      | "done.invoke.checking:invocation[0]"
      | "error.platform.checking:invocation[0]";
    setAutocomplete:
      | "done.invoke.addressManager.loading.autocomplete.processing:invocation[0]"
      | "done.invoke.addressManager.searching:invocation[0]";
    setConstants: "done.invoke.addressManager.loading.constants.processing:invocation[0]";
    setError:
      | "error.platform.addressManager.loading.autocomplete.processing:invocation[0]"
      | "error.platform.addressManager.loading.constants.processing:invocation[0]"
      | "error.platform.addressManager.populating:invocation[0]"
      | "error.platform.addressManager.processing.adding:invocation[0]"
      | "error.platform.addressManager.processing.removing:invocation[0]"
      | "error.platform.addressManager.processing.setting:invocation[0]"
      | "error.platform.addressManager.processing.updating:invocation[0]"
      | "error.platform.addressManager.searching:invocation[0]";
    setModel:
      | "SET"
      | "done.invoke.addressManager.populating:invocation[0]"
      | "done.invoke.addressManager.processing.adding:invocation[0]"
      | "done.invoke.addressManager.processing.setting:invocation[0]"
      | "done.invoke.addressManager.processing.updating:invocation[0]";
    setSchemas:
      | "done.invoke.addressManager.processing.adding:invocation[0]"
      | "done.invoke.addressManager.processing.removing:invocation[0]"
      | "done.invoke.addressManager.processing.setting:invocation[0]"
      | "done.invoke.addressManager.processing.updating:invocation[0]"
      | "done.invoke.checking:invocation[0]"
      | "done.state.addressManager.loading"
      | "error.platform.checking:invocation[0]";
    setSearch: "SEARCH";
  };
  eventsCausingDelays: {
    wait:
      | "done.invoke.addressManager.processing.adding:invocation[0]"
      | "done.invoke.addressManager.processing.removing:invocation[0]"
      | "done.invoke.addressManager.processing.setting:invocation[0]"
      | "done.invoke.addressManager.processing.updating:invocation[0]";
  };
  eventsCausingGuards: {
    canRemove: "REMOVE";
    hasSelectedAddress: "SEARCH";
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
    loadAddressDetails: "SEARCH";
    loadConstants:
      | "CLEAR"
      | "DEFAULT"
      | "REMOVE"
      | "SEARCH"
      | "SET"
      | "xstate.init";
    remove: "REMOVE";
    search: "SEARCH";
    setDefault: "DEFAULT";
    update: "UPDATE";
    validate:
      | "SET"
      | "done.invoke.addressManager.populating:invocation[0]"
      | "done.invoke.addressManager.searching:invocation[0]"
      | "done.state.addressManager.loading"
      | "error.platform.addressManager.searching:invocation[0]";
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

// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.addressManager.loading.autocomplete.processing:invocation[0]": {
      type: "done.invoke.addressManager.loading.autocomplete.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.addressManager.loading.constants.processing:invocation[0]": {
      type: "done.invoke.addressManager.loading.constants.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.addressManager.populating:invocation[0]": {
      type: "done.invoke.addressManager.populating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.addressManager.processing.adding:invocation[0]": {
      type: "done.invoke.addressManager.processing.adding:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.addressManager.processing.removing:invocation[0]": {
      type: "done.invoke.addressManager.processing.removing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.addressManager.processing.setting:invocation[0]": {
      type: "done.invoke.addressManager.processing.setting:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.addressManager.processing.updating:invocation[0]": {
      type: "done.invoke.addressManager.processing.updating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.addressManager.searching:invocation[0]": {
      type: "done.invoke.addressManager.searching:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.checking:invocation[0]": {
      type: "done.invoke.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.addressManager.loading.autocomplete.processing:invocation[0]": {
      type: "error.platform.addressManager.loading.autocomplete.processing:invocation[0]";
      data: unknown;
    };
    "error.platform.addressManager.loading.constants.processing:invocation[0]": {
      type: "error.platform.addressManager.loading.constants.processing:invocation[0]";
      data: unknown;
    };
    "error.platform.addressManager.populating:invocation[0]": {
      type: "error.platform.addressManager.populating:invocation[0]";
      data: unknown;
    };
    "error.platform.addressManager.processing.adding:invocation[0]": {
      type: "error.platform.addressManager.processing.adding:invocation[0]";
      data: unknown;
    };
    "error.platform.addressManager.processing.removing:invocation[0]": {
      type: "error.platform.addressManager.processing.removing:invocation[0]";
      data: unknown;
    };
    "error.platform.addressManager.processing.setting:invocation[0]": {
      type: "error.platform.addressManager.processing.setting:invocation[0]";
      data: unknown;
    };
    "error.platform.addressManager.processing.updating:invocation[0]": {
      type: "error.platform.addressManager.processing.updating:invocation[0]";
      data: unknown;
    };
    "error.platform.addressManager.searching:invocation[0]": {
      type: "error.platform.addressManager.searching:invocation[0]";
      data: unknown;
    };
    "error.platform.checking:invocation[0]": {
      type: "error.platform.checking:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    add: "done.invoke.addressManager.processing.adding:invocation[0]";
    configureAutocomplete: "done.invoke.addressManager.loading.autocomplete.processing:invocation[0]";
    loadAddressDetails: "done.invoke.addressManager.populating:invocation[0]";
    loadConstants: "done.invoke.addressManager.loading.constants.processing:invocation[0]";
    remove: "done.invoke.addressManager.processing.removing:invocation[0]";
    search: "done.invoke.addressManager.searching:invocation[0]";
    setDefault: "done.invoke.addressManager.processing.setting:invocation[0]";
    update: "done.invoke.addressManager.processing.updating:invocation[0]";
    validate: "done.invoke.checking:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services:
      | "add"
      | "configureAutocomplete"
      | "loadAddressDetails"
      | "loadConstants"
      | "remove"
      | "search"
      | "setDefault"
      | "update"
      | "validate";
  };
  eventsCausingActions: {
    clearAutocomplete:
      | "done.invoke.addressManager.populating:invocation[0]"
      | "error.platform.addressManager.populating:invocation[0]";
    clearError:
      | "CLEAR"
      | "DEFAULT"
      | "REMOVE"
      | "RETRY"
      | "SEARCH"
      | "SET"
      | "UPDATE"
      | "done.invoke.addressManager.populating:invocation[0]"
      | "done.invoke.addressManager.searching:invocation[0]"
      | "done.state.addressManager.loading"
      | "error.platform.addressManager.searching:invocation[0]"
      | "xstate.init";
    clearModel:
      | "CLEAR"
      | "done.invoke.addressManager.processing.removing:invocation[0]";
    refresh:
      | "done.invoke.checking:invocation[0]"
      | "error.platform.checking:invocation[0]";
    setAutocomplete:
      | "done.invoke.addressManager.loading.autocomplete.processing:invocation[0]"
      | "done.invoke.addressManager.searching:invocation[0]";
    setConstants: "done.invoke.addressManager.loading.constants.processing:invocation[0]";
    setError:
      | "error.platform.addressManager.loading.autocomplete.processing:invocation[0]"
      | "error.platform.addressManager.loading.constants.processing:invocation[0]"
      | "error.platform.addressManager.populating:invocation[0]"
      | "error.platform.addressManager.processing.adding:invocation[0]"
      | "error.platform.addressManager.processing.removing:invocation[0]"
      | "error.platform.addressManager.processing.setting:invocation[0]"
      | "error.platform.addressManager.processing.updating:invocation[0]"
      | "error.platform.addressManager.searching:invocation[0]";
    setModel:
      | "SET"
      | "done.invoke.addressManager.populating:invocation[0]"
      | "done.invoke.addressManager.processing.adding:invocation[0]"
      | "done.invoke.addressManager.processing.setting:invocation[0]"
      | "done.invoke.addressManager.processing.updating:invocation[0]";
    setSchemas:
      | "done.invoke.addressManager.processing.adding:invocation[0]"
      | "done.invoke.addressManager.processing.removing:invocation[0]"
      | "done.invoke.addressManager.processing.setting:invocation[0]"
      | "done.invoke.addressManager.processing.updating:invocation[0]"
      | "done.invoke.checking:invocation[0]"
      | "done.state.addressManager.loading"
      | "error.platform.checking:invocation[0]";
    setSearch: "SEARCH";
  };
  eventsCausingDelays: {
    wait:
      | "done.invoke.addressManager.processing.adding:invocation[0]"
      | "done.invoke.addressManager.processing.removing:invocation[0]"
      | "done.invoke.addressManager.processing.setting:invocation[0]"
      | "done.invoke.addressManager.processing.updating:invocation[0]";
  };
  eventsCausingGuards: {
    canRemove: "REMOVE";
    hasSelectedAddress: "SEARCH";
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
    loadAddressDetails: "SEARCH";
    loadConstants:
      | "CLEAR"
      | "DEFAULT"
      | "REMOVE"
      | "SEARCH"
      | "SET"
      | "xstate.init";
    remove: "REMOVE";
    search: "SEARCH";
    setDefault: "DEFAULT";
    update: "UPDATE";
    validate:
      | "SET"
      | "done.invoke.addressManager.populating:invocation[0]"
      | "done.invoke.addressManager.searching:invocation[0]"
      | "done.state.addressManager.loading"
      | "error.platform.addressManager.searching:invocation[0]";
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
