// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.billingDetailsManager.checking.parsing:invocation[0]": {
      type: "done.invoke.billingDetailsManager.checking.parsing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.billingDetailsManager.checking.validating:invocation[0]": {
      type: "done.invoke.billingDetailsManager.checking.validating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.billingDetailsManager.loading:invocation[0]": {
      type: "done.invoke.billingDetailsManager.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.billingDetailsManager.processing:invocation[0]": {
      type: "done.invoke.billingDetailsManager.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.billingDetailsManager.checking.validating:invocation[0]": {
      type: "error.platform.billingDetailsManager.checking.validating:invocation[0]";
      data: unknown;
    };
    "error.platform.billingDetailsManager.loading:invocation[0]": {
      type: "error.platform.billingDetailsManager.loading:invocation[0]";
      data: unknown;
    };
    "error.platform.billingDetailsManager.processing:invocation[0]": {
      type: "error.platform.billingDetailsManager.processing:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    load: "done.invoke.billingDetailsManager.loading:invocation[0]";
    parse: "done.invoke.billingDetailsManager.checking.parsing:invocation[0]";
    update: "done.invoke.billingDetailsManager.processing:invocation[0]";
    validate: "done.invoke.billingDetailsManager.checking.validating:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "load" | "parse" | "update" | "validate";
  };
  eventsCausingActions: {
    clearDirty: "done.invoke.billingDetailsManager.processing:invocation[0]";
    clearError:
      | "CLEAR"
      | "REFRESH"
      | "RETRY"
      | "SET"
      | "UNAUTHENTICATED"
      | "UPDATE"
      | "done.invoke.billingDetailsManager.loading:invocation[0]"
      | "xstate.init";
    clearModel: "CLEAR" | "UNAUTHENTICATED";
    clearSchemas: "UNAUTHENTICATED";
    refreshContext: "REFRESH";
    setContext:
      | "done.invoke.billingDetailsManager.checking.parsing:invocation[0]"
      | "done.invoke.billingDetailsManager.loading:invocation[0]";
    setDirty: "CLEAR" | "SET";
    setError:
      | "error.platform.billingDetailsManager.checking.validating:invocation[0]"
      | "error.platform.billingDetailsManager.loading:invocation[0]"
      | "error.platform.billingDetailsManager.processing:invocation[0]";
    setFeedbackError:
      | "error.platform.billingDetailsManager.loading:invocation[0]"
      | "error.platform.billingDetailsManager.processing:invocation[0]";
    setFeedbackSuccess: "done.invoke.billingDetailsManager.processing:invocation[0]";
    setModel:
      | "SET"
      | "done.invoke.billingDetailsManager.processing:invocation[0]";
    setSchemas:
      | "REFRESH"
      | "done.invoke.billingDetailsManager.checking.parsing:invocation[0]"
      | "done.invoke.billingDetailsManager.loading:invocation[0]";
  };
  eventsCausingDelays: {
    wait: "done.invoke.billingDetailsManager.processing:invocation[0]";
  };
  eventsCausingGuards: {
    isDirty: "done.invoke.billingDetailsManager.checking.validating:invocation[0]";
  };
  eventsCausingServices: {
    load: "CLEAR" | "REFRESH" | "SET" | "UNAUTHENTICATED" | "xstate.init";
    parse:
      | "CLEAR"
      | "REFRESH"
      | "SET"
      | "done.invoke.billingDetailsManager.loading:invocation[0]";
    update: "RETRY" | "UPDATE";
    validate: "done.invoke.billingDetailsManager.checking.parsing:invocation[0]";
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
