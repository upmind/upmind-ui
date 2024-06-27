// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.authCallback": {
      type: "done.invoke.authCallback";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
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
    "done.invoke.billingDetailsManager.checking:invocation[0]": {
      type: "done.invoke.billingDetailsManager.checking:invocation[0]";
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
    "error.platform.authCallback": {
      type: "error.platform.authCallback";
      data: unknown;
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
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    authSubscription: "done.invoke.authCallback";
    isAuthenticated: "done.invoke.billingDetailsManager.checking:invocation[0]";
    load: "done.invoke.loading:invocation[0]";
    parse: "done.invoke.billingDetailsManager.available.checking.parsing:invocation[0]";
    update: "done.invoke.processing:invocation[0]";
    validate: "done.invoke.billingDetailsManager.available.checking.validating:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services:
      | "authSubscription"
      | "isAuthenticated"
      | "load"
      | "parse"
      | "update"
      | "validate";
  };
  eventsCausingActions: {
    clearDirty: "done.invoke.processing:invocation[0]";
    clearError:
      | "AUTHENTICATED"
      | "CLEAR"
      | "REFRESH"
      | "RETRY"
      | "SET"
      | "UNAUTHENTICATED"
      | "UPDATE"
      | "done.invoke.billingDetailsManager.checking:invocation[0]"
      | "done.invoke.loading:invocation[0]";
    clearModel: "CLEAR" | "UNAUTHENTICATED";
    clearSchemas: "UNAUTHENTICATED";
    refreshContext: "REFRESH";
    setContext:
      | "done.invoke.billingDetailsManager.available.checking.parsing:invocation[0]"
      | "done.invoke.loading:invocation[0]";
    setDirty: "CLEAR" | "SET";
    setError:
      | "error.platform.billingDetailsManager.available.checking.validating:invocation[0]"
      | "error.platform.loading:invocation[0]"
      | "error.platform.processing:invocation[0]";
    setFeedbackError:
      | "error.platform.loading:invocation[0]"
      | "error.platform.processing:invocation[0]";
    setModel: "SET" | "done.invoke.processing:invocation[0]";
    setSchemas:
      | "REFRESH"
      | "done.invoke.billingDetailsManager.available.checking.parsing:invocation[0]"
      | "done.invoke.loading:invocation[0]";
  };
  eventsCausingDelays: {
    wait: "done.invoke.processing:invocation[0]";
  };
  eventsCausingGuards: {
    hasBasket: "UPDATE";
    hasChanged: "REFRESH";
    isDirty: "done.invoke.billingDetailsManager.available.checking.validating:invocation[0]";
  };
  eventsCausingServices: {
    authSubscription: "UNAUTHENTICATED" | "xstate.init";
    isAuthenticated: "SESSION";
    load:
      | "AUTHENTICATED"
      | "CLEAR"
      | "REFRESH"
      | "RETRY"
      | "SET"
      | "done.invoke.billingDetailsManager.checking:invocation[0]";
    parse: "CLEAR" | "SET" | "done.invoke.loading:invocation[0]";
    update: "RETRY" | "UPDATE";
    validate: "done.invoke.billingDetailsManager.available.checking.parsing:invocation[0]";
  };
  matchesStates:
    | "available"
    | "available.checking"
    | "available.checking.parsing"
    | "available.checking.validating"
    | "available.invalid"
    | "available.loading"
    | "available.processed"
    | "available.processing"
    | "available.valid"
    | "checking"
    | "complete"
    | "error"
    | "subscribing"
    | "unavailable"
    | {
        available?:
          | "checking"
          | "invalid"
          | "loading"
          | "processed"
          | "processing"
          | "valid"
          | { checking?: "parsing" | "validating" };
      };
  tags: never;
}
