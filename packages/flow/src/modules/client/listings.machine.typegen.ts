// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.clientListingsManager.filtering:invocation[0]": {
      type: "done.invoke.clientListingsManager.filtering:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.clientListingsManager.loading:invocation[0]": {
      type: "done.invoke.clientListingsManager.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.clientListingsManager.filtering:invocation[0]": {
      type: "error.platform.clientListingsManager.filtering:invocation[0]";
      data: unknown;
    };
    "error.platform.clientListingsManager.loading:invocation[0]": {
      type: "error.platform.clientListingsManager.loading:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    filter: "done.invoke.clientListingsManager.filtering:invocation[0]";
    load: "done.invoke.clientListingsManager.loading:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "filter" | "load";
  };
  eventsCausingActions: {
    add: "ADD";
    clearError:
      | "ADD"
      | "EDIT"
      | "FILTER"
      | "REFRESH"
      | "SELECT"
      | "STOP"
      | "xstate.init";
    clearItems:
      | "ADD"
      | "EDIT"
      | "FILTER"
      | "REFRESH"
      | "SELECT"
      | "STOP"
      | "xstate.init";
    clearSelected: "error.platform.clientListingsManager.loading:invocation[0]";
    resetFiltered:
      | "done.invoke.clientListingsManager.loading:invocation[0]"
      | "error.platform.clientListingsManager.filtering:invocation[0]";
    setError: "error.platform.clientListingsManager.loading:invocation[0]";
    setFiltered: "done.invoke.clientListingsManager.filtering:invocation[0]";
    setFilters: "FILTER";
    setInitial:
      | "REFRESH"
      | "done.invoke.clientListingsManager.loading:invocation[0]";
    setItems: "done.invoke.clientListingsManager.loading:invocation[0]";
    setSelected: "EDIT" | "SELECT";
    setSelectedNew: "ADD";
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
    filter: "FILTER";
    load:
      | "ADD"
      | "EDIT"
      | "FILTER"
      | "REFRESH"
      | "SELECT"
      | "STOP"
      | "xstate.init";
  };
  matchesStates:
    | "available"
    | "complete"
    | "editing"
    | "empty"
    | "error"
    | "filtered"
    | "filtered.available"
    | "filtered.empty"
    | "filtering"
    | "loading"
    | "processing"
    | { filtered?: "available" | "empty" };
  tags: never;
}
