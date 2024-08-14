// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.domainManager.existing.loading:invocation[0]": {
      type: "done.invoke.domainManager.existing.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.processing:invocation[0]": {
      type: "done.invoke.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.domainManager.existing.loading:invocation[0]": {
      type: "error.platform.domainManager.existing.loading:invocation[0]";
      data: unknown;
    };
    "error.platform.processing:invocation[0]": {
      type: "error.platform.processing:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#domainManager.basket.processing": {
      type: "xstate.after(wait)#domainManager.basket.processing";
    };
    "xstate.after(wait)#domainManager.existing.processing": {
      type: "xstate.after(wait)#domainManager.existing.processing";
    };
    "xstate.init": { type: "xstate.init" };
    "xstate.stop": { type: "xstate.stop" };
  };
  invokeSrcNameMap: {
    getClientDomains: "done.invoke.domainManager.existing.loading:invocation[0]";
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
    cancelController: "" | "CHOOSE" | "REFRESH" | "SEARCH" | "SYNCED";
    checkChoices: "" | "ERROR" | "FETCHED";
    checkModel: "CHOOSE" | "STOP" | "xstate.init";
    clearError:
      | ""
      | "ADD"
      | "CHOOSE"
      | "REFRESH"
      | "REMOVE"
      | "SEARCH"
      | "SYNCED"
      | "UPDATE";
    clearLookups: "CHOOSE" | "RESET" | "STOP" | "xstate.init";
    clearModel: "CHOOSE" | "STOP" | "UPDATE" | "xstate.stop";
    clearSearch: "RESET";
    ensurePrimary:
      | "ADD"
      | "CHOOSE"
      | "FETCHED"
      | "REMOVE"
      | "STOP"
      | "UPDATE"
      | "xstate.init";
    fetchBasket: "" | "CHOOSE";
    newController: "" | "CHOOSE" | "REFRESH" | "SEARCH";
    persistModel: "CHOOSE" | "STOP" | "xstate.init";
    remove: "REMOVE";
    resetModel: "RESET";
    setBasket: "FETCHED";
    setBasketHelper: "";
    setBasketItems: "FETCHED";
    setCurrency: "REFRESH";
    setError:
      | "ERROR"
      | "error.platform.domainManager.existing.loading:invocation[0]"
      | "error.platform.processing:invocation[0]";
    setModel: "FETCHED" | "UPDATE";
    setOwned: "done.invoke.domainManager.existing.loading:invocation[0]";
    setPrimary: "SELECT";
    setPromotions: "REFRESH";
    setSearch: "SEARCH";
    setSearched: "done.invoke.processing:invocation[0]";
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
    hasValidSearch: "";
    isBasket: "CHOOSE";
    isDomainRegister: "CHOOSE";
    isDomainTransfer: "CHOOSE";
    isExistingDomain: "CHOOSE";
    isInvalidType: "CHOOSE";
    isNotCancelled:
      | "error.platform.domainManager.existing.loading:invocation[0]"
      | "error.platform.processing:invocation[0]";
    isValidDomain: "ADD";
    isValidSearch: "SEARCH";
    needsBasketHelper: "";
  };
  eventsCausingServices: {
    getClientDomains: "" | "CHOOSE";
    search: "" | "REFRESH" | "SEARCH";
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
    | "existing.loading"
    | "existing.processing"
    | "existing.valid"
    | "idle"
    | "loading"
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
        existing?: "error" | "invalid" | "loading" | "processing" | "valid";
      };
  tags: never;
}
