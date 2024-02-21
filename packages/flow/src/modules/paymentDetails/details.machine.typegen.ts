// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.paymentDetailsManager.checking.parsing:invocation[0]": {
      type: "done.invoke.paymentDetailsManager.checking.parsing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.paymentDetailsManager.checking.validating:invocation[0]": {
      type: "done.invoke.paymentDetailsManager.checking.validating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.paymentDetailsManager.loading:invocation[0]": {
      type: "done.invoke.paymentDetailsManager.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.stripe:invocation[0]": {
      type: "done.invoke.stripe:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.paymentDetailsManager.checking.validating:invocation[0]": {
      type: "error.platform.paymentDetailsManager.checking.validating:invocation[0]";
      data: unknown;
    };
    "error.platform.paymentDetailsManager.loading:invocation[0]": {
      type: "error.platform.paymentDetailsManager.loading:invocation[0]";
      data: unknown;
    };
    "error.platform.stripe:invocation[0]": {
      type: "error.platform.stripe:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    load: "done.invoke.paymentDetailsManager.loading:invocation[0]";
    parse: "done.invoke.paymentDetailsManager.checking.parsing:invocation[0]";
    validate: "done.invoke.paymentDetailsManager.checking.validating:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "load" | "parse" | "validate";
  };
  eventsCausingActions: {
    clearElementToMount: "done.invoke.paymentDetailsManager.checking.validating:invocation[0]";
    clearError:
      | "CLEAR"
      | "REFRESH"
      | "SET"
      | "UNAUTHENTICATED"
      | "done.invoke.paymentDetailsManager.checking.validating:invocation[0]"
      | "done.invoke.paymentDetailsManager.loading:invocation[0]"
      | "xstate.init";
    clearModel: "CLEAR" | "UNAUTHENTICATED";
    clearSchemas: "UNAUTHENTICATED";
    providePaymentDetails: "done.invoke.stripe:invocation[0]";
    refreshContext: "REFRESH";
    setContext:
      | "done.invoke.paymentDetailsManager.checking.parsing:invocation[0]"
      | "done.invoke.paymentDetailsManager.loading:invocation[0]";
    setDirty: "CLEAR" | "SET";
    setElementToMount: "MOUNT";
    setError:
      | "error.platform.paymentDetailsManager.checking.validating:invocation[0]"
      | "error.platform.paymentDetailsManager.loading:invocation[0]"
      | "error.platform.stripe:invocation[0]";
    setFeedbackError:
      | "error.platform.paymentDetailsManager.loading:invocation[0]"
      | "error.platform.stripe:invocation[0]";
    setModel: "SET";
    setPaymentDetails: "done.invoke.stripe:invocation[0]";
    setSchemas:
      | "REFRESH"
      | "done.invoke.paymentDetailsManager.checking.parsing:invocation[0]"
      | "done.invoke.paymentDetailsManager.loading:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    isStripe: "";
  };
  eventsCausingServices: {
    load: "CLEAR" | "REFRESH" | "SET" | "UNAUTHENTICATED" | "xstate.init";
    parse:
      | "CLEAR"
      | "SET"
      | "done.invoke.paymentDetailsManager.loading:invocation[0]";
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
    | "valid"
    | "valid.complete"
    | "valid.gateway"
    | "valid.stripe"
    | {
        checking?: "parsing" | "validating";
        valid?: "complete" | "gateway" | "stripe";
      };
  tags: never;
}
