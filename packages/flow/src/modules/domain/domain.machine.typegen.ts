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
    "xstate.after(wait)#domainManager.basket.updating": {
      type: "xstate.after(wait)#domainManager.basket.updating";
    };
    "xstate.after(wait)#domainManager.existing.processing.cancelling": {
      type: "xstate.after(wait)#domainManager.existing.processing.cancelling";
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
    checkChoices: "";
    clearAvailable:
      | ""
      | "CHOOSE"
      | "REFRESH"
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
    clearValues: "" | "CHOOSE" | "STOP" | "UPDATE" | "xstate.stop";
    newController: "" | "CHOOSE" | "REFRESH" | "SEARCH";
    remove: "REMOVE";
    setAvailable:
      | "done.invoke.domainManager.existing.loading:invocation[0]"
      | "done.invoke.processing:invocation[0]";
    setBasketHelper: "";
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
    wait: "" | "REFRESH" | "SEARCH" | "SELECT";
  };
  eventsCausingGuards: {
    hasAvailable: "";
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
    | "basket.loading"
    | "basket.updating"
    | "basket.valid"
    | "complete"
    | "dac"
    | "dac.available"
    | "dac.complete"
    | "dac.error"
    | "dac.idle"
    | "dac.processing"
    | "dac.syncing"
    | "dac.valid"
    | "existing"
    | "existing.available"
    | "existing.error"
    | "existing.idle"
    | "existing.invalid"
    | "existing.loading"
    | "existing.processing"
    | "existing.processing.cancelling"
    | "existing.valid"
    | "idle"
    | "subscribing"
    | {
        basket?: "loading" | "updating" | "valid";
        dac?:
          | "available"
          | "complete"
          | "error"
          | "idle"
          | "processing"
          | "syncing"
          | "valid";
        existing?:
          | "available"
          | "error"
          | "idle"
          | "invalid"
          | "loading"
          | "processing"
          | "valid"
          | { processing?: "cancelling" };
      };
  tags: never;
}
