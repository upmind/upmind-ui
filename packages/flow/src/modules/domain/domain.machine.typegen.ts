// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.domainManager.active.register.processing.searching:invocation[0]": {
      type: "done.invoke.domainManager.active.register.processing.searching:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.domainManager.active.transfer.processing.searching:invocation[0]": {
      type: "done.invoke.domainManager.active.transfer.processing.searching:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.domainManager.active.register.processing.searching:invocation[0]": {
      type: "error.platform.domainManager.active.register.processing.searching:invocation[0]";
      data: unknown;
    };
    "error.platform.domainManager.active.transfer.processing.searching:invocation[0]": {
      type: "error.platform.domainManager.active.transfer.processing.searching:invocation[0]";
      data: unknown;
    };
    "xstate.after(error)#error": { type: "xstate.after(error)#error" };
    "xstate.after(wait)#domainManager.active.existing.processing.cancelling": {
      type: "xstate.after(wait)#domainManager.active.existing.processing.cancelling";
    };
    "xstate.after(wait)#domainManager.active.register.processing.cancelling": {
      type: "xstate.after(wait)#domainManager.active.register.processing.cancelling";
    };
    "xstate.after(wait)#domainManager.active.transfer.processing.cancelling": {
      type: "xstate.after(wait)#domainManager.active.transfer.processing.cancelling";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    search:
      | "done.invoke.domainManager.active.register.processing.searching:invocation[0]"
      | "done.invoke.domainManager.active.transfer.processing.searching:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "search";
  };
  eventsCausingActions: {
    add: "ADD";
    addExisting: "ADD";
    cancelController: "ADD" | "SEARCH";
    clearAvailable:
      | "xstate.after(wait)#domainManager.active.register.processing.cancelling"
      | "xstate.after(wait)#domainManager.active.transfer.processing.cancelling";
    clearError:
      | "xstate.after(wait)#domainManager.active.register.processing.cancelling"
      | "xstate.after(wait)#domainManager.active.transfer.processing.cancelling";
    newController:
      | "xstate.after(wait)#domainManager.active.register.processing.cancelling"
      | "xstate.after(wait)#domainManager.active.transfer.processing.cancelling";
    remove: "REMOVE";
    setAvailable:
      | "done.invoke.domainManager.active.register.processing.searching:invocation[0]"
      | "done.invoke.domainManager.active.transfer.processing.searching:invocation[0]";
    setError:
      | "error.platform.domainManager.active.register.processing.searching:invocation[0]"
      | "error.platform.domainManager.active.transfer.processing.searching:invocation[0]";
    setSearch: "SEARCH";
    setType: "CHOOSE";
  };
  eventsCausingDelays: {
    error: "CHOOSE";
    wait: "ADD" | "SEARCH";
  };
  eventsCausingGuards: {
    hasAvailable: "ADD";
    hasValues: "REMOVE";
    isDomainRegister: "CHOOSE";
    isDomainTransfer: "CHOOSE";
    isExistingDomain: "CHOOSE";
    isForced: "" | "CHOOSE";
    isInvalidType: "CHOOSE";
    isNotCancelled:
      | "error.platform.domainManager.active.register.processing.searching:invocation[0]"
      | "error.platform.domainManager.active.transfer.processing.searching:invocation[0]";
    isValidDomain: "ADD";
    isValidSearch: "SEARCH";
  };
  eventsCausingServices: {
    search:
      | "xstate.after(wait)#domainManager.active.register.processing.cancelling"
      | "xstate.after(wait)#domainManager.active.transfer.processing.cancelling";
  };
  matchesStates:
    | "active"
    | "active.existing"
    | "active.existing.available"
    | "active.existing.error"
    | "active.existing.idle"
    | "active.existing.processing"
    | "active.existing.processing.cancelling"
    | "active.loading"
    | "active.register"
    | "active.register.available"
    | "active.register.error"
    | "active.register.idle"
    | "active.register.processing"
    | "active.register.processing.cancelling"
    | "active.register.processing.searching"
    | "active.transfer"
    | "active.transfer.available"
    | "active.transfer.error"
    | "active.transfer.idle"
    | "active.transfer.processing"
    | "active.transfer.processing.cancelling"
    | "active.transfer.processing.searching"
    | "complete"
    | "error"
    | "idle"
    | {
        active?:
          | "existing"
          | "loading"
          | "register"
          | "transfer"
          | {
              existing?:
                | "available"
                | "error"
                | "idle"
                | "processing"
                | { processing?: "cancelling" };
              register?:
                | "available"
                | "error"
                | "idle"
                | "processing"
                | { processing?: "cancelling" | "searching" };
              transfer?:
                | "available"
                | "error"
                | "idle"
                | "processing"
                | { processing?: "cancelling" | "searching" };
            };
      };
  tags: never;
}
