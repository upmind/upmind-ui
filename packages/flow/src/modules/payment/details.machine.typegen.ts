// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.authCallback": {
      type: "done.invoke.authCallback";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.paymentDetailsManager.checking.parsing:invocation[0]": {
      type: "done.invoke.paymentDetailsManager.checking.parsing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.paymentDetailsManager.loading:invocation[0]": {
      type: "done.invoke.paymentDetailsManager.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.paymentDetailsManager.processing:invocation[0]": {
      type: "done.invoke.paymentDetailsManager.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.authCallback": {
      type: "error.platform.authCallback";
      data: unknown;
    };
    "error.platform.paymentDetailsManager.checking.validating:invocation[0]": {
      type: "error.platform.paymentDetailsManager.checking.validating:invocation[0]";
      data: unknown;
    };
    "error.platform.paymentDetailsManager.loading:invocation[0]": {
      type: "error.platform.paymentDetailsManager.loading:invocation[0]";
      data: unknown;
    };
    "error.platform.paymentDetailsManager.processing:invocation[0]": {
      type: "error.platform.paymentDetailsManager.processing:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    authSubscription: "done.invoke.authCallback";
    load: "done.invoke.paymentDetailsManager.loading:invocation[0]";
    parse: "done.invoke.paymentDetailsManager.checking.parsing:invocation[0]";
    update: "done.invoke.paymentDetailsManager.processing:invocation[0]";
    validate: "done.invoke.paymentDetailsManager.checking.validating:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "authSubscription" | "load" | "parse" | "update" | "validate";
  };
  eventsCausingActions: {
    clearError:
      | "CLEAR"
      | "RETRY"
      | "SESSION"
      | "SET"
      | "UNAUTHENTICATED"
      | "UPDATE"
      | "done.invoke.paymentDetailsManager.loading:invocation[0]";
    clearModel: "CLEAR" | "UNAUTHENTICATED";
    clearSchemas: "UNAUTHENTICATED";
    setContext:
      | "done.invoke.paymentDetailsManager.checking.parsing:invocation[0]"
      | "done.invoke.paymentDetailsManager.loading:invocation[0]";
    setError:
      | "error.platform.paymentDetailsManager.checking.validating:invocation[0]"
      | "error.platform.paymentDetailsManager.loading:invocation[0]"
      | "error.platform.paymentDetailsManager.processing:invocation[0]";
    setFeedbackError:
      | "error.platform.paymentDetailsManager.loading:invocation[0]"
      | "error.platform.paymentDetailsManager.processing:invocation[0]";
    setFeedbackSuccess: "done.invoke.paymentDetailsManager.processing:invocation[0]";
    setModel:
      | "SET"
      | "done.invoke.paymentDetailsManager.processing:invocation[0]";
    setSchemas:
      | "done.invoke.paymentDetailsManager.checking.parsing:invocation[0]"
      | "done.invoke.paymentDetailsManager.loading:invocation[0]";
  };
  eventsCausingDelays: {
    wait: "done.invoke.paymentDetailsManager.processing:invocation[0]";
  };
  eventsCausingGuards: {};
  eventsCausingServices: {
    authSubscription: "CLEAR" | "SET" | "UNAUTHENTICATED" | "xstate.init";
    load: "SESSION" | "UNAUTHENTICATED";
    parse:
      | "CLEAR"
      | "SET"
      | "done.invoke.paymentDetailsManager.loading:invocation[0]";
    update: "RETRY" | "UPDATE";
    validate: "done.invoke.paymentDetailsManager.checking.parsing:invocation[0]";
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
    | "subscribing"
    | "valid"
    | { checking?: "parsing" | "validating" };
  tags: never;
}
