// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.authCallback": {
      type: "done.invoke.authCallback";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.clientListingsManager.available.filtering:invocation[0]": {
      type: "done.invoke.clientListingsManager.available.filtering:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.clientListingsManager.checking:invocation[0]": {
      type: "done.invoke.clientListingsManager.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.loading:invocation[0]": {
      type: "done.invoke.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.authCallback": {
      type: "error.platform.authCallback";
      data: unknown;
    };
    "error.platform.clientListingsManager.available.filtering:invocation[0]": {
      type: "error.platform.clientListingsManager.available.filtering:invocation[0]";
      data: unknown;
    };
    "error.platform.loading:invocation[0]": {
      type: "error.platform.loading:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    authSubscription: "done.invoke.authCallback";
    filter: "done.invoke.clientListingsManager.available.filtering:invocation[0]";
    isAuthenticated: "done.invoke.clientListingsManager.checking:invocation[0]";
    load: "done.invoke.loading:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "authSubscription" | "filter" | "isAuthenticated" | "load";
  };
  eventsCausingActions: {
    add: "ADD";
    clearError:
      | "ADD"
      | "AUTHENTICATED"
      | "EDIT"
      | "FILTER"
      | "REFRESH"
      | "UNAUTHENTICATED"
      | "done.invoke.clientListingsManager.checking:invocation[0]";
    clearItems:
      | "ADD"
      | "AUTHENTICATED"
      | "EDIT"
      | "FILTER"
      | "REFRESH"
      | "UNAUTHENTICATED"
      | "done.invoke.clientListingsManager.checking:invocation[0]";
    clearSelected: "error.platform.loading:invocation[0]";
    resetFiltered:
      | "done.invoke.loading:invocation[0]"
      | "error.platform.clientListingsManager.available.filtering:invocation[0]";
    setError: "error.platform.loading:invocation[0]";
    setFiltered: "done.invoke.clientListingsManager.available.filtering:invocation[0]";
    setFilters: "FILTER";
    setInitial: "REFRESH" | "done.invoke.loading:invocation[0]";
    setItems: "done.invoke.loading:invocation[0]";
    setSelected: "EDIT" | "SELECT";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    hasFilteredItems: "";
    hasItems: "";
    hasNoFilteredItems: "";
    hasNoItems: "";
    isNotProcessing: "";
  };
  eventsCausingServices: {
    authSubscription: "STOP" | "UNAUTHENTICATED" | "xstate.init";
    filter: "FILTER";
    isAuthenticated: "SESSION";
    load:
      | "ADD"
      | "AUTHENTICATED"
      | "EDIT"
      | "FILTER"
      | "REFRESH"
      | "done.invoke.clientListingsManager.checking:invocation[0]";
  };
  matchesStates:
    | "available"
    | "available.adding"
    | "available.editing"
    | "available.empty"
    | "available.filtered"
    | "available.filtered.available"
    | "available.filtered.empty"
    | "available.filtering"
    | "available.idle"
    | "available.loading"
    | "available.processing"
    | "checking"
    | "complete"
    | "error"
    | "subscribing"
    | "unavailable"
    | {
        available?:
          | "adding"
          | "editing"
          | "empty"
          | "filtered"
          | "filtering"
          | "idle"
          | "loading"
          | "processing"
          | { filtered?: "available" | "empty" };
      };
  tags: never;
}
