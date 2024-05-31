// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.basketPromotionsManager.checking.parsing:invocation[0]": {
      type: "done.invoke.basketPromotionsManager.checking.parsing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.basketPromotionsManager.checking.validating:invocation[0]": {
      type: "done.invoke.basketPromotionsManager.checking.validating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.basketPromotionsManager.loading:invocation[0]": {
      type: "done.invoke.basketPromotionsManager.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.basketPromotionsManager.processing.remove:invocation[0]": {
      type: "done.invoke.basketPromotionsManager.processing.remove:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.basketPromotionsManager.processing.update:invocation[0]": {
      type: "done.invoke.basketPromotionsManager.processing.update:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.basketPromotionsManager.checking.validating:invocation[0]": {
      type: "error.platform.basketPromotionsManager.checking.validating:invocation[0]";
      data: unknown;
    };
    "error.platform.basketPromotionsManager.loading:invocation[0]": {
      type: "error.platform.basketPromotionsManager.loading:invocation[0]";
      data: unknown;
    };
    "error.platform.basketPromotionsManager.processing.remove:invocation[0]": {
      type: "error.platform.basketPromotionsManager.processing.remove:invocation[0]";
      data: unknown;
    };
    "error.platform.basketPromotionsManager.processing.update:invocation[0]": {
      type: "error.platform.basketPromotionsManager.processing.update:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    add: "done.invoke.basketPromotionsManager.processing.update:invocation[0]";
    load: "done.invoke.basketPromotionsManager.loading:invocation[0]";
    parse: "done.invoke.basketPromotionsManager.checking.parsing:invocation[0]";
    remove: "done.invoke.basketPromotionsManager.processing.remove:invocation[0]";
    validate: "done.invoke.basketPromotionsManager.checking.validating:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "add" | "load" | "parse" | "remove" | "validate";
  };
  eventsCausingActions: {
    clearDirty:
      | "done.invoke.basketPromotionsManager.processing.remove:invocation[0]"
      | "done.invoke.basketPromotionsManager.processing.update:invocation[0]";
    clearError:
      | "ADD"
      | "CLEAR"
      | "REFRESH"
      | "REMOVE"
      | "SET"
      | "UNAUTHENTICATED"
      | "UPDATE"
      | "xstate.init";
    clearModel: "CLEAR" | "UNAUTHENTICATED";
    clearSchemas: "UNAUTHENTICATED";
    refreshContext: "REFRESH";
    setContext:
      | "done.invoke.basketPromotionsManager.checking.parsing:invocation[0]"
      | "done.invoke.basketPromotionsManager.loading:invocation[0]";
    setDirty: "CLEAR" | "SET";
    setError:
      | "error.platform.basketPromotionsManager.checking.validating:invocation[0]"
      | "error.platform.basketPromotionsManager.loading:invocation[0]"
      | "error.platform.basketPromotionsManager.processing.remove:invocation[0]"
      | "error.platform.basketPromotionsManager.processing.update:invocation[0]";
    setFeedbackError:
      | "error.platform.basketPromotionsManager.loading:invocation[0]"
      | "error.platform.basketPromotionsManager.processing.remove:invocation[0]"
      | "error.platform.basketPromotionsManager.processing.update:invocation[0]";
    setFeedbackSuccess:
      | "done.invoke.basketPromotionsManager.processing.remove:invocation[0]"
      | "done.invoke.basketPromotionsManager.processing.update:invocation[0]";
    setModel:
      | "SET"
      | "done.invoke.basketPromotionsManager.processing.remove:invocation[0]"
      | "done.invoke.basketPromotionsManager.processing.update:invocation[0]";
    setSchemas:
      | "REFRESH"
      | "done.invoke.basketPromotionsManager.checking.parsing:invocation[0]"
      | "done.invoke.basketPromotionsManager.loading:invocation[0]";
  };
  eventsCausingDelays: {
    wait:
      | "done.invoke.basketPromotionsManager.processing.remove:invocation[0]"
      | "done.invoke.basketPromotionsManager.processing.update:invocation[0]";
  };
  eventsCausingGuards: {
    hasBasket: "UPDATE";
    isDirty:
      | "done.invoke.basketPromotionsManager.checking.validating:invocation[0]"
      | "error.platform.basketPromotionsManager.checking.validating:invocation[0]";
  };
  eventsCausingServices: {
    add: "ADD" | "REMOVE" | "UPDATE";
    load:
      | "CLEAR"
      | "REFRESH"
      | "REMOVE"
      | "SET"
      | "UNAUTHENTICATED"
      | "xstate.init";
    parse: "CLEAR" | "REFRESH" | "SET";
    remove: "REMOVE";
    validate: "done.invoke.basketPromotionsManager.checking.parsing:invocation[0]";
  };
  matchesStates:
    | "checking"
    | "checking.parsing"
    | "checking.validating"
    | "complete"
    | "error"
    | "invalid"
    | "loading"
    | "processed"
    | "processing"
    | "processing.remove"
    | "processing.update"
    | "valid"
    | { checking?: "parsing" | "validating"; processing?: "remove" | "update" };
  tags: never;
}
