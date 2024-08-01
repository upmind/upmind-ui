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
    cancelController: "" | "CHOOSE" | "REFRESH" | "SEARCH";
    checkChoices: "ERROR" | "SYNCED";
    clearAvailable:
      | ""
      | "CHOOSE"
      | "REFRESH"
      | "RESET"
      | "SEARCH"
      | "STOP"
      | "xstate.stop";
    clearError:
      | ""
      | "ADD"
      | "CHOOSE"
      | "REFRESH"
      | "REMOVE"
      | "SEARCH"
      | "UPDATE";
    clearSearch: "RESET";
    clearValues: "" | "CHOOSE" | "RESET" | "STOP" | "UPDATE" | "xstate.stop";
    fetchBasket: "" | "CHOOSE";
    newController: "" | "CHOOSE" | "REFRESH" | "SEARCH";
    remove: "REMOVE";
    setAvailable:
      | "SYNCED"
      | "done.invoke.domainManager.existing.loading:invocation[0]"
      | "done.invoke.processing:invocation[0]";
    setBasketHelper: "";
    setBasketItems: "SYNCED";
    setCurrency: "REFRESH";
    setError:
      | "ERROR"
      | "error.platform.domainManager.existing.loading:invocation[0]"
      | "error.platform.processing:invocation[0]";
    setPrimary: "SELECT";
    setPromotions: "REFRESH";
    setSearch: "SEARCH";
    setType: "CHOOSE";
    setValues: "UPDATE";
    syncBasket: "SYNC";
    synced: "SYNCED";
  };
  eventsCausingDelays: {
    wait: "SELECT";
  };
  eventsCausingGuards: {
    hasNoValues: "";
    hasValidSearch: "";
    hasValues: "" | "REMOVE" | "SELECT";
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
