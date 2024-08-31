// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.billingDetailsManager.available.checking.parsing:invocation[0]": {
      type: "done.invoke.billingDetailsManager.available.checking.parsing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.billingDetailsManager.available.checking.validating:invocation[0]": {
      type: "done.invoke.billingDetailsManager.available.checking.validating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.loading:invocation[0]": {
      type: "done.invoke.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.processing:invocation[0]": {
      type: "done.invoke.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.billingDetailsManager.available.checking.validating:invocation[0]": {
      type: "error.platform.billingDetailsManager.available.checking.validating:invocation[0]";
      data: unknown;
    };
    "error.platform.loading:invocation[0]": {
      type: "error.platform.loading:invocation[0]";
      data: unknown;
    };
    "error.platform.processing:invocation[0]": {
      type: "error.platform.processing:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    load: "done.invoke.loading:invocation[0]";
    parse: "done.invoke.billingDetailsManager.available.checking.parsing:invocation[0]";
    update: "done.invoke.processing:invocation[0]";
    validate: "done.invoke.billingDetailsManager.available.checking.validating:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "load" | "parse" | "update" | "validate";
  };
  eventsCausingActions: {
    clearAutoUpdate: "done.invoke.processing:invocation[0]";
    clearDirty: "CLEAR" | "done.invoke.processing:invocation[0]";
    clearError:
      | ""
      | "CLEAR"
      | "REFRESH"
      | "SET"
      | "UPDATE"
      | "done.invoke.loading:invocation[0]";
    clearModel: "CLEAR";
    refreshContext: "REFRESH";
    setAutoUpdate: "SET";
    setDirty: "CLEAR" | "SET";
    setError:
      | "error.platform.billingDetailsManager.available.checking.validating:invocation[0]"
      | "error.platform.loading:invocation[0]"
      | "error.platform.processing:invocation[0]";
    setFeedbackError:
      | "error.platform.loading:invocation[0]"
      | "error.platform.processing:invocation[0]";
    setLookups: "done.invoke.loading:invocation[0]";
    setModel: "SET" | "done.invoke.processing:invocation[0]";
    setParsed: "done.invoke.billingDetailsManager.available.checking.parsing:invocation[0]";
    setSchemas:
      | "REFRESH"
      | "done.invoke.billingDetailsManager.available.checking.parsing:invocation[0]"
      | "done.invoke.loading:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    hasBasket: "UPDATE";
    hasChanged: "REFRESH";
    hasClient: "";
    isDirty: "done.invoke.billingDetailsManager.available.checking.validating:invocation[0]";
    shouldUpdate: "";
  };
  eventsCausingServices: {
    load: "" | "CLEAR" | "REFRESH" | "SET";
    parse: "CLEAR" | "REFRESH" | "SET" | "done.invoke.loading:invocation[0]";
    update: "" | "UPDATE";
    validate: "done.invoke.billingDetailsManager.available.checking.parsing:invocation[0]";
  };
  matchesStates:
    | "available"
    | "available.checking"
    | "available.checking.parsing"
    | "available.checking.validating"
    | "available.invalid"
    | "available.loading"
    | "available.processing"
    | "available.valid"
    | "complete"
    | "error"
    | "subscribing"
    | {
        available?:
          | "checking"
          | "invalid"
          | "loading"
          | "processing"
          | "valid"
          | { checking?: "parsing" | "validating" };
      };
  tags: never;
}
