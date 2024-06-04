// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
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
    "error.platform.paymentDetailsManager.checking.validating:invocation[0]": {
      type: "error.platform.paymentDetailsManager.checking.validating:invocation[0]";
      data: unknown;
    };
    "error.platform.paymentDetailsManager.loading:invocation[0]": {
      type: "error.platform.paymentDetailsManager.loading:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
    "xstate.update": { type: "xstate.update" };
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
    clearError:
      | "CLEAR"
      | "REFRESH"
      | "SET"
      | "UNAUTHENTICATED"
      | "done.invoke.paymentDetailsManager.loading:invocation[0]"
      | "xstate.init"
      | "xstate.update";
    clearModel: "CLEAR" | "UNAUTHENTICATED";
    clearSchemas: "UNAUTHENTICATED";
    forwardCheckout: "CHECKOUT";
    providePaymentDetails: "PAYMENT_DETAILS";
    refreshContext: "REFRESH";
    setContext:
      | "done.invoke.paymentDetailsManager.checking.parsing:invocation[0]"
      | "done.invoke.paymentDetailsManager.loading:invocation[0]";
    setError:
      | "error.platform.paymentDetailsManager.checking.validating:invocation[0]"
      | "error.platform.paymentDetailsManager.loading:invocation[0]";
    setFeedbackError: "error.platform.paymentDetailsManager.loading:invocation[0]";
    setModel: "SET";
    setPaymentDetails: "PAYMENT_DETAILS";
    setSchemas:
      | "REFRESH"
      | "done.invoke.paymentDetailsManager.checking.parsing:invocation[0]"
      | "done.invoke.paymentDetailsManager.loading:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    hasBasket: "CHECKOUT";
    hasChanged: "REFRESH";
  };
  eventsCausingServices: {
    load: "CLEAR" | "REFRESH" | "SET" | "UNAUTHENTICATED" | "xstate.init";
    parse:
      | "CLEAR"
      | "SET"
      | "done.invoke.paymentDetailsManager.loading:invocation[0]"
      | "xstate.update";
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
    | "processing"
    | "valid"
    | { checking?: "parsing" | "validating" };
  tags: never;
}
