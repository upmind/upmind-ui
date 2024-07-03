// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.authCallback": {
      type: "done.invoke.authCallback";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.loading:invocation[0]": {
      type: "done.invoke.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.paymentDetailsManager.available.checking.parsing:invocation[0]": {
      type: "done.invoke.paymentDetailsManager.available.checking.parsing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.paymentDetailsManager.available.processing:invocation[0]": {
      type: "done.invoke.paymentDetailsManager.available.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.paymentDetailsManager.checking:invocation[0]": {
      type: "done.invoke.paymentDetailsManager.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.authCallback": {
      type: "error.platform.authCallback";
      data: unknown;
    };
    "error.platform.loading:invocation[0]": {
      type: "error.platform.loading:invocation[0]";
      data: unknown;
    };
    "error.platform.paymentDetailsManager.available.checking.validating:invocation[0]": {
      type: "error.platform.paymentDetailsManager.available.checking.validating:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
    "xstate.update": { type: "xstate.update" };
  };
  invokeSrcNameMap: {
    authSubscription: "done.invoke.authCallback";
    isAuthenticated: "done.invoke.paymentDetailsManager.checking:invocation[0]";
    load: "done.invoke.loading:invocation[0]";
    parse: "done.invoke.paymentDetailsManager.available.checking.parsing:invocation[0]";
    update: "done.invoke.paymentDetailsManager.available.processing:invocation[0]";
    validate: "done.invoke.paymentDetailsManager.available.checking.validating:invocation[0]";
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
    clearAutoUpdate: "done.invoke.paymentDetailsManager.available.processing:invocation[0]";
    clearError:
      | "AUTHENTICATED"
      | "CLEAR"
      | "REFRESH"
      | "SET"
      | "UNAUTHENTICATED"
      | "done.invoke.loading:invocation[0]"
      | "done.invoke.paymentDetailsManager.checking:invocation[0]"
      | "xstate.update";
    clearModel: "CLEAR" | "UNAUTHENTICATED";
    clearSchemas: "UNAUTHENTICATED";
    forwardCheckout: "" | "CHECKOUT";
    providePaymentDetails:
      | "PAYMENT_DETAILS"
      | "done.invoke.paymentDetailsManager.available.processing:invocation[0]";
    refreshActors: "REFRESH";
    refreshBasket: "REFRESH";
    setAutoUpdate: "SET";
    setDirty: "CLEAR" | "SET";
    setError:
      | "error.platform.loading:invocation[0]"
      | "error.platform.paymentDetailsManager.available.checking.validating:invocation[0]";
    setFeedbackError: "error.platform.loading:invocation[0]";
    setGateway: "done.invoke.paymentDetailsManager.available.checking.parsing:invocation[0]";
    setLookups: "done.invoke.loading:invocation[0]";
    setModel: "SET";
    setParsed: "done.invoke.paymentDetailsManager.available.checking.parsing:invocation[0]";
    setPaymentDetails:
      | "PAYMENT_DETAILS"
      | "done.invoke.paymentDetailsManager.available.processing:invocation[0]";
    setSchemas:
      | "REFRESH"
      | "done.invoke.paymentDetailsManager.available.checking.parsing:invocation[0]";
    trackPaymentDetails: "done.invoke.paymentDetailsManager.available.processing:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    hasBasket: "CHECKOUT";
    isFree: "error.platform.paymentDetailsManager.available.checking.validating:invocation[0]";
    shouldUpdate: "";
  };
  eventsCausingServices: {
    authSubscription: "UNAUTHENTICATED" | "xstate.init";
    isAuthenticated: "SESSION";
    load:
      | "AUTHENTICATED"
      | "CLEAR"
      | "REFRESH"
      | "SET"
      | "done.invoke.paymentDetailsManager.checking:invocation[0]";
    parse:
      | "CLEAR"
      | "REFRESH"
      | "SET"
      | "done.invoke.loading:invocation[0]"
      | "xstate.update";
    update: "" | "CHECKOUT";
    validate: "done.invoke.paymentDetailsManager.available.checking.parsing:invocation[0]";
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
          | "processing"
          | "valid"
          | { checking?: "parsing" | "validating" };
      };
  tags: never;
}
