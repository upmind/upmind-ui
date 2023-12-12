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
    addExisting: "ADD";
    cancelController:
      | ""
      | "ADD"
      | "CHOOSE"
      | "REFRESH"
      | "REMOVE"
      | "SEARCH"
      | "SYNC";
    clearAvailable:
      | ""
      | "ADD"
      | "CHOOSE"
      | "REFRESH"
      | "REMOVE"
      | "SYNC"
      | "xstate.after(wait)#domainManager.register.processing.cancelling"
      | "xstate.after(wait)#domainManager.transfer.processing.cancelling";
    clearError:
      | ""
      | "ADD"
      | "CHOOSE"
      | "REFRESH"
      | "REMOVE"
      | "SYNC"
      | "xstate.after(wait)#domainManager.register.processing.cancelling"
      | "xstate.after(wait)#domainManager.transfer.processing.cancelling";
    newController:
      | ""
      | "ADD"
      | "CHOOSE"
      | "REFRESH"
      | "REMOVE"
      | "SYNC"
      | "xstate.after(wait)#domainManager.register.processing.cancelling"
      | "xstate.after(wait)#domainManager.transfer.processing.cancelling";
    remove: "REMOVE";
    setAvailable:
      | "done.invoke.domainManager.existing.loading:invocation[0]"
      | "done.invoke.domainManager.register.processing.searching:invocation[0]"
      | "done.invoke.domainManager.transfer.processing.searching:invocation[0]";
    setError:
      | "error.platform.domainManager.existing.loading:invocation[0]"
      | "error.platform.domainManager.register.processing.searching:invocation[0]"
      | "error.platform.domainManager.transfer.processing.searching:invocation[0]";
    setSearch: "SEARCH";
    setType: "CHOOSE";
    sync: "SYNC";
  };
  eventsCausingDelays: {
    error: "CHOOSE";
    wait: "SEARCH";
  };
  eventsCausingGuards: {
    hasAvailable: "ADD";
    hasNoValues: "";
    hasValues: "" | "REMOVE";
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
    getClientDomains: "" | "ADD" | "CHOOSE" | "REFRESH" | "REMOVE" | "SYNC";
    search:
      | "xstate.after(wait)#domainManager.register.processing.cancelling"
      | "xstate.after(wait)#domainManager.transfer.processing.cancelling";
  };
  matchesStates:
    | "basket"
    | "basket.loading"
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
    | "existing.syncing"
    | "existing.valid"
    | "idle"
    | "loading"
    | "register"
    | "register.available"
    | "register.error"
    | "register.idle"
    | "register.processing"
    | "register.processing.cancelling"
    | "register.processing.searching"
    | "register.syncing"
    | "register.valid"
    | "transfer"
    | "transfer.available"
    | "transfer.error"
    | "transfer.idle"
    | "transfer.processing"
    | "transfer.processing.cancelling"
    | "transfer.processing.searching"
    | "transfer.syncing"
    | "transfer.valid"
    | {
        basket?: "loading" | "valid";
        existing?:
          | "available"
          | "error"
          | "idle"
          | "loading"
          | "processing"
          | "syncing"
          | "valid"
          | { processing?: "cancelling" };
        register?:
          | "available"
          | "error"
          | "idle"
          | "processing"
          | "syncing"
          | "valid"
          | { processing?: "cancelling" | "searching" };
        transfer?:
          | "available"
          | "error"
          | "idle"
          | "processing"
          | "syncing"
          | "valid"
          | { processing?: "cancelling" | "searching" };
      };
  tags: never;
}
