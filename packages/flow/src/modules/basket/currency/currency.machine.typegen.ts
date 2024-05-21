// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.basketCurrencyManager.checking.parsing:invocation[0]": {
      type: "done.invoke.basketCurrencyManager.checking.parsing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.basketCurrencyManager.checking.validating:invocation[0]": {
      type: "done.invoke.basketCurrencyManager.checking.validating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.basketCurrencyManager.loading:invocation[0]": {
      type: "done.invoke.basketCurrencyManager.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.basketCurrencyManager.processing:invocation[0]": {
      type: "done.invoke.basketCurrencyManager.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.basketCurrencyManager.checking.validating:invocation[0]": {
      type: "error.platform.basketCurrencyManager.checking.validating:invocation[0]";
      data: unknown;
    };
    "error.platform.basketCurrencyManager.loading:invocation[0]": {
      type: "error.platform.basketCurrencyManager.loading:invocation[0]";
      data: unknown;
    };
    "error.platform.basketCurrencyManager.processing:invocation[0]": {
      type: "error.platform.basketCurrencyManager.processing:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    load: "done.invoke.basketCurrencyManager.loading:invocation[0]";
    parse: "done.invoke.basketCurrencyManager.checking.parsing:invocation[0]";
    update: "done.invoke.basketCurrencyManager.processing:invocation[0]";
    validate: "done.invoke.basketCurrencyManager.checking.validating:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "load" | "parse" | "update" | "validate";
  };
  eventsCausingActions: {
    clearDirty: "done.invoke.basketCurrencyManager.processing:invocation[0]";
    clearError:
      | "CLEAR"
      | "REFRESH"
      | "RETRY"
      | "SET"
      | "UNAUTHENTICATED"
      | "UPDATE"
      | "done.invoke.basketCurrencyManager.loading:invocation[0]"
      | "xstate.init";
    clearModel: "CLEAR" | "UNAUTHENTICATED";
    clearSchemas: "UNAUTHENTICATED";
    refreshContext: "REFRESH";
    setContext:
      | "done.invoke.basketCurrencyManager.checking.parsing:invocation[0]"
      | "done.invoke.basketCurrencyManager.loading:invocation[0]";
    setDirty: "CLEAR" | "SET";
    setError:
      | "error.platform.basketCurrencyManager.checking.validating:invocation[0]"
      | "error.platform.basketCurrencyManager.loading:invocation[0]"
      | "error.platform.basketCurrencyManager.processing:invocation[0]";
    setFeedbackError:
      | "error.platform.basketCurrencyManager.loading:invocation[0]"
      | "error.platform.basketCurrencyManager.processing:invocation[0]";
    setFeedbackSuccess: "done.invoke.basketCurrencyManager.processing:invocation[0]";
    setModel:
      | "SET"
      | "done.invoke.basketCurrencyManager.processing:invocation[0]";
    setSchemas:
      | "REFRESH"
      | "done.invoke.basketCurrencyManager.checking.parsing:invocation[0]"
      | "done.invoke.basketCurrencyManager.loading:invocation[0]";
  };
  eventsCausingDelays: {
    wait: "done.invoke.basketCurrencyManager.processing:invocation[0]";
  };
  eventsCausingGuards: {
    hasBasket: "UPDATE";
    isDirty: "done.invoke.basketCurrencyManager.checking.validating:invocation[0]";
  };
  eventsCausingServices: {
    load: "CLEAR" | "REFRESH" | "SET" | "UNAUTHENTICATED" | "xstate.init";
    parse:
      | "CLEAR"
      | "SET"
      | "done.invoke.basketCurrencyManager.loading:invocation[0]";
    update: "RETRY" | "UPDATE";
    validate: "done.invoke.basketCurrencyManager.checking.parsing:invocation[0]";
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
    | "valid"
    | { checking?: "parsing" | "validating" };
  tags: never;
}
