// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.domainManager.loading.existing.processing:invocation[0]": {
      type: "done.invoke.domainManager.loading.existing.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.processing:invocation[0]": {
      type: "done.invoke.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.processing:invocation[0]": {
      type: "error.platform.processing:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#domainManager.basket.processing": {
      type: "xstate.after(wait)#domainManager.basket.processing";
    };
    "xstate.init": { type: "xstate.init" };
    "xstate.stop": { type: "xstate.stop" };
  };
  invokeSrcNameMap: {
    getClientDomains: "done.invoke.domainManager.loading.existing.processing:invocation[0]";
    search: "done.invoke.processing:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "getClientDomains" | "search";
  };
  eventsCausingActions: {
    add: "ADD";
    cancelController: "" | "CHOOSE" | "REFRESH" | "SEARCH" | "SEARCH.OFFSET";
    checkChoices: "FETCHED" | "done.state.domainManager.loading";
    checkModel:
      | "AUTHENTICATED"
      | "CHOOSE"
      | "STOP"
      | "UNAUTHENTICATED"
      | "xstate.init";
    clearError:
      | ""
      | "ADD"
      | "CHOOSE"
      | "REFRESH"
      | "REMOVE"
      | "SEARCH"
      | "SEARCH.OFFSET"
      | "UPDATE";
    clearLookups:
      | "AUTHENTICATED"
      | "CHOOSE"
      | "STOP"
      | "UNAUTHENTICATED"
      | "xstate.init";
    clearModel:
      | "AUTHENTICATED"
      | "CHOOSE"
      | "STOP"
      | "UNAUTHENTICATED"
      | "UPDATE"
      | "xstate.stop";
    clearSearch: "RESET";
    ensurePrimary:
      | "ADD"
      | "AUTHENTICATED"
      | "CHOOSE"
      | "FETCHED"
      | "REMOVE"
      | "STOP"
      | "UNAUTHENTICATED"
      | "UPDATE"
      | "xstate.init";
    fetchBasket: "" | "AUTHENTICATED" | "CHOOSE" | "UNAUTHENTICATED";
    newController: "";
    persistModel:
      | "AUTHENTICATED"
      | "CHOOSE"
      | "STOP"
      | "UNAUTHENTICATED"
      | "xstate.init";
    remove: "REMOVE";
    resetLookups: "RESET";
    resetModel: "RESET";
    setAuthHelper: "";
    setBasketHelper: "";
    setBasketItems: "FETCHED";
    setContext:
      | "AUTHENTICATED"
      | "CHOOSE"
      | "STOP"
      | "UNAUTHENTICATED"
      | "xstate.init";
    setCurrency: "REFRESH";
    setError: "ERROR" | "error.platform.processing:invocation[0]";
    setModel: "FETCHED" | "UPDATE";
    setOwned: "done.invoke.domainManager.loading.existing.processing:invocation[0]";
    setPrimary: "SELECT";
    setPromotions: "REFRESH";
    setSearchOffset: "SEARCH.OFFSET";
    setSearchQuery: "SEARCH";
    setSearchResults: "done.invoke.processing:invocation[0]";
    setType: "CHOOSE";
    syncBasket: "SYNC";
    synced: "SYNCED";
  };
  eventsCausingDelays: {
    wait: "SELECT";
  };
  eventsCausingGuards: {
    hasModel: "" | "REMOVE" | "SELECT";
    hasNoModel: "";
    hasSearchQuery: "";
    isBasket: "CHOOSE";
    isDomainRegister: "CHOOSE";
    isDomainTransfer: "CHOOSE";
    isExistingDomain: "CHOOSE";
    isInvalidType: "CHOOSE";
    isNotCancelled: "error.platform.processing:invocation[0]";
    isValidDomain: "ADD";
    validSearchOffset: "SEARCH.OFFSET";
    validSearchQuery: "SEARCH";
  };
  eventsCausingServices: {
    getClientDomains: "" | "AUTHENTICATED" | "UNAUTHENTICATED";
    search: "";
  };
  matchesStates:
    | "basket"
    | "basket.complete"
    | "basket.error"
    | "basket.invalid"
    | "basket.loading"
    | "basket.processing"
    | "basket.syncing"
    | "basket.valid"
    | "complete"
    | "dac"
    | "dac.complete"
    | "dac.error"
    | "dac.invalid"
    | "dac.loading"
    | "dac.processing"
    | "dac.syncing"
    | "dac.valid"
    | "existing"
    | "existing.error"
    | "existing.invalid"
    | "existing.valid"
    | "idle"
    | "loading"
    | "loading.basket"
    | "loading.basket.complete"
    | "loading.basket.processing"
    | "loading.existing"
    | "loading.existing.complete"
    | "loading.existing.processing"
    | "subscribing"
    | {
        basket?:
          | "complete"
          | "error"
          | "invalid"
          | "loading"
          | "processing"
          | "syncing"
          | "valid";
        dac?:
          | "complete"
          | "error"
          | "invalid"
          | "loading"
          | "processing"
          | "syncing"
          | "valid";
        existing?: "error" | "invalid" | "valid";
        loading?:
          | "basket"
          | "existing"
          | {
              basket?: "complete" | "processing";
              existing?: "complete" | "processing";
            };
      };
  tags: never;
}
