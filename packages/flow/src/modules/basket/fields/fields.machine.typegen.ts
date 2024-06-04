// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.basketFieldsManager.checking.parsing:invocation[0]": {
      type: "done.invoke.basketFieldsManager.checking.parsing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.basketFieldsManager.checking.validating:invocation[0]": {
      type: "done.invoke.basketFieldsManager.checking.validating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.basketFieldsManager.loading:invocation[0]": {
      type: "done.invoke.basketFieldsManager.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.basketFieldsManager.processing:invocation[0]": {
      type: "done.invoke.basketFieldsManager.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.basketFieldsManager.checking.validating:invocation[0]": {
      type: "error.platform.basketFieldsManager.checking.validating:invocation[0]";
      data: unknown;
    };
    "error.platform.basketFieldsManager.loading:invocation[0]": {
      type: "error.platform.basketFieldsManager.loading:invocation[0]";
      data: unknown;
    };
    "error.platform.basketFieldsManager.processing:invocation[0]": {
      type: "error.platform.basketFieldsManager.processing:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    load: "done.invoke.basketFieldsManager.loading:invocation[0]";
    parse: "done.invoke.basketFieldsManager.checking.parsing:invocation[0]";
    update: "done.invoke.basketFieldsManager.processing:invocation[0]";
    validate: "done.invoke.basketFieldsManager.checking.validating:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "load" | "parse" | "update" | "validate";
  };
  eventsCausingActions: {
    clearDirty: "done.invoke.basketFieldsManager.processing:invocation[0]";
    clearError:
      | "CLEAR"
      | "REFRESH"
      | "RETRY"
      | "SET"
      | "UNAUTHENTICATED"
      | "UPDATE"
      | "done.invoke.basketFieldsManager.loading:invocation[0]"
      | "xstate.init";
    clearModel: "CLEAR" | "UNAUTHENTICATED";
    clearSchemas: "UNAUTHENTICATED";
    refreshContext: "REFRESH";
    setContext:
      | "done.invoke.basketFieldsManager.checking.parsing:invocation[0]"
      | "done.invoke.basketFieldsManager.loading:invocation[0]";
    setDirty: "CLEAR" | "SET";
    setError:
      | "error.platform.basketFieldsManager.checking.validating:invocation[0]"
      | "error.platform.basketFieldsManager.loading:invocation[0]"
      | "error.platform.basketFieldsManager.processing:invocation[0]";
    setFeedbackError:
      | "error.platform.basketFieldsManager.loading:invocation[0]"
      | "error.platform.basketFieldsManager.processing:invocation[0]";
    setFeedbackSuccess: "done.invoke.basketFieldsManager.processing:invocation[0]";
    setModel:
      | "SET"
      | "done.invoke.basketFieldsManager.processing:invocation[0]";
    setSchemas:
      | "REFRESH"
      | "done.invoke.basketFieldsManager.checking.parsing:invocation[0]"
      | "done.invoke.basketFieldsManager.loading:invocation[0]";
  };
  eventsCausingDelays: {
    wait: "done.invoke.basketFieldsManager.processing:invocation[0]";
  };
  eventsCausingGuards: {
    hasBasket: "UPDATE";
    hasChanged: "REFRESH";
    isDirty: "done.invoke.basketFieldsManager.checking.validating:invocation[0]";
  };
  eventsCausingServices: {
    load: "CLEAR" | "REFRESH" | "SET" | "UNAUTHENTICATED" | "xstate.init";
    parse:
      | "CLEAR"
      | "REFRESH"
      | "SET"
      | "done.invoke.basketFieldsManager.loading:invocation[0]";
    update: "RETRY" | "UPDATE";
    validate: "done.invoke.basketFieldsManager.checking.parsing:invocation[0]";
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
