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
    "done.invoke.domainManager.register.processing.searching:invocation[0]": {
      type: "done.invoke.domainManager.register.processing.searching:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.domainManager.transfer.processing.searching:invocation[0]": {
      type: "done.invoke.domainManager.transfer.processing.searching:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.domainManager.existing.loading:invocation[0]": {
      type: "error.platform.domainManager.existing.loading:invocation[0]";
      data: unknown;
    };
    "error.platform.domainManager.register.processing.searching:invocation[0]": {
      type: "error.platform.domainManager.register.processing.searching:invocation[0]";
      data: unknown;
    };
    "error.platform.domainManager.transfer.processing.searching:invocation[0]": {
      type: "error.platform.domainManager.transfer.processing.searching:invocation[0]";
      data: unknown;
    };
    "xstate.after(error)#error": { type: "xstate.after(error)#error" };
    "xstate.after(wait)#domainManager.basket.updating": {
      type: "xstate.after(wait)#domainManager.basket.updating";
    };
    "xstate.after(wait)#domainManager.existing.processing.cancelling": {
      type: "xstate.after(wait)#domainManager.existing.processing.cancelling";
    };
    "xstate.after(wait)#domainManager.register.processing.cancelling": {
      type: "xstate.after(wait)#domainManager.register.processing.cancelling";
    };
    "xstate.after(wait)#domainManager.transfer.processing.cancelling": {
      type: "xstate.after(wait)#domainManager.transfer.processing.cancelling";
    };
    "xstate.init": { type: "xstate.init" };
    "xstate.stop": { type: "xstate.stop" };
  };
  invokeSrcNameMap: {
    getClientDomains: "done.invoke.domainManager.existing.loading:invocation[0]";
    search:
      | "done.invoke.domainManager.register.processing.searching:invocation[0]"
      | "done.invoke.domainManager.transfer.processing.searching:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "getClientDomains" | "search";
  };
  eventsCausingActions: {
    add: "ADD";
    cancelController: "" | "CHOOSE" | "REFRESH" | "REMOVE" | "SEARCH";
    checkChoices:
      | ""
      | "CHOOSE"
      | "STOP"
      | "xstate.after(error)#error"
      | "xstate.init";
    clearAvailable:
      | ""
      | "CHOOSE"
      | "REFRESH"
      | "REMOVE"
      | "xstate.after(wait)#domainManager.register.processing.cancelling"
      | "xstate.after(wait)#domainManager.transfer.processing.cancelling";
    clearError:
      | ""
      | "CHOOSE"
      | "REFRESH"
      | "REMOVE"
      | "xstate.after(wait)#domainManager.register.processing.cancelling"
      | "xstate.after(wait)#domainManager.transfer.processing.cancelling";
    clearValues:
      | ""
      | "ADD"
      | "CHOOSE"
      | "REMOVE"
      | "STOP"
      | "UPDATE"
      | "xstate.stop";
    newController:
      | ""
      | "CHOOSE"
      | "REFRESH"
      | "REMOVE"
      | "xstate.after(wait)#domainManager.register.processing.cancelling"
      | "xstate.after(wait)#domainManager.transfer.processing.cancelling";
    remove: "REMOVE";
    setAvailable:
      | "done.invoke.domainManager.existing.loading:invocation[0]"
      | "done.invoke.domainManager.register.processing.searching:invocation[0]"
      | "done.invoke.domainManager.transfer.processing.searching:invocation[0]";
    setCurrency: "REFRESH";
    setError:
      | "error.platform.domainManager.existing.loading:invocation[0]"
      | "error.platform.domainManager.register.processing.searching:invocation[0]"
      | "error.platform.domainManager.transfer.processing.searching:invocation[0]";
    setPrimary: "SELECT";
    setPromotions: "REFRESH";
    setSearch: "SEARCH";
    setType: "CHOOSE";
    setValues: "UPDATE";
  };
  eventsCausingDelays: {
    error: "CHOOSE";
    wait: "REFRESH" | "SEARCH" | "SELECT";
  };
  eventsCausingGuards: {
    hasNoValues: "";
    hasValues: "" | "REMOVE" | "SELECT";
    isBasket: "CHOOSE";
    isDomainRegister: "CHOOSE";
    isDomainTransfer: "CHOOSE";
    isExistingDomain: "CHOOSE";
    isForced: "CHOOSE";
    isInvalidType: "CHOOSE";
    isNotCancelled:
      | "error.platform.domainManager.existing.loading:invocation[0]"
      | "error.platform.domainManager.register.processing.searching:invocation[0]"
      | "error.platform.domainManager.transfer.processing.searching:invocation[0]";
    isValidDomain: "ADD";
    isValidSearch: "SEARCH";
  };
  eventsCausingServices: {
    getClientDomains: "" | "CHOOSE" | "REFRESH" | "REMOVE";
    search:
      | "xstate.after(wait)#domainManager.register.processing.cancelling"
      | "xstate.after(wait)#domainManager.transfer.processing.cancelling";
  };
  matchesStates:
    | "basket"
    | "basket.loading"
    | "basket.updating"
    | "basket.valid"
    | "complete"
    | "error"
    | "existing"
    | "existing.available"
    | "existing.error"
    | "existing.idle"
    | "existing.loading"
    | "existing.processing"
    | "existing.processing.cancelling"
    | "existing.valid"
    | "idle"
    | "register"
    | "register.available"
    | "register.error"
    | "register.idle"
    | "register.processing"
    | "register.processing.cancelling"
    | "register.processing.searching"
    | "register.valid"
    | "transfer"
    | "transfer.available"
    | "transfer.error"
    | "transfer.idle"
    | "transfer.processing"
    | "transfer.processing.cancelling"
    | "transfer.processing.searching"
    | "transfer.valid"
    | {
        basket?: "loading" | "updating" | "valid";
        existing?:
          | "available"
          | "error"
          | "idle"
          | "loading"
          | "processing"
          | "valid"
          | { processing?: "cancelling" };
        register?:
          | "available"
          | "error"
          | "idle"
          | "processing"
          | "valid"
          | { processing?: "cancelling" | "searching" };
        transfer?:
          | "available"
          | "error"
          | "idle"
          | "processing"
          | "valid"
          | { processing?: "cancelling" | "searching" };
      };
  tags: never;
}
