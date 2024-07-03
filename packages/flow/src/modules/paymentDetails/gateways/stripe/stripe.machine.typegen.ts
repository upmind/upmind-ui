// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.stripePaymentManager.checking.parsing:invocation[0]": {
      type: "done.invoke.stripePaymentManager.checking.parsing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.stripePaymentManager.loading.addElement:invocation[0]": {
      type: "done.invoke.stripePaymentManager.loading.addElement:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.stripePaymentManager.loading.paymentElement:invocation[0]": {
      type: "done.invoke.stripePaymentManager.loading.paymentElement:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.stripePaymentManager.loading.stripe:invocation[0]": {
      type: "done.invoke.stripePaymentManager.loading.stripe:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.stripePaymentManager.processing.adding:invocation[0]": {
      type: "done.invoke.stripePaymentManager.processing.adding:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.stripePaymentManager.processing.payment:invocation[0]": {
      type: "done.invoke.stripePaymentManager.processing.payment:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.stripePaymentManager.checking.validating:invocation[0]": {
      type: "error.platform.stripePaymentManager.checking.validating:invocation[0]";
      data: unknown;
    };
    "error.platform.stripePaymentManager.loading.addElement:invocation[0]": {
      type: "error.platform.stripePaymentManager.loading.addElement:invocation[0]";
      data: unknown;
    };
    "error.platform.stripePaymentManager.loading.paymentElement:invocation[0]": {
      type: "error.platform.stripePaymentManager.loading.paymentElement:invocation[0]";
      data: unknown;
    };
    "error.platform.stripePaymentManager.loading.stripe:invocation[0]": {
      type: "error.platform.stripePaymentManager.loading.stripe:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    confirmSetup: "done.invoke.stripePaymentManager.processing.adding:invocation[0]";
    createAddElement: "done.invoke.stripePaymentManager.loading.addElement:invocation[0]";
    createPaymentElement: "done.invoke.stripePaymentManager.loading.paymentElement:invocation[0]";
    load: "done.invoke.stripePaymentManager.loading.stripe:invocation[0]";
    parse: "done.invoke.stripePaymentManager.checking.parsing:invocation[0]";
    update: "done.invoke.stripePaymentManager.processing.payment:invocation[0]";
    validate: "done.invoke.stripePaymentManager.checking.validating:invocation[0]";
  };
  missingImplementations: {
    actions: "set";
    delays: never;
    guards: never;
    services:
      | "confirmSetup"
      | "createAddElement"
      | "createPaymentElement"
      | "load"
      | "parse"
      | "update"
      | "validate";
  };
  eventsCausingActions: {
    clearError:
      | "ADD"
      | "CHECKOUT"
      | "CLEAR"
      | "PAY"
      | "REFRESH"
      | "RETRY"
      | "SET"
      | "UNAUTHENTICATED"
      | "VALIDATE";
    clearModel: "CLEAR" | "UNAUTHENTICATED";
    clearSchemas: "UNAUTHENTICATED";
    providePaymentDetails: "done.invoke.stripePaymentManager.processing.payment:invocation[0]";
    set: "done.invoke.stripePaymentManager.processing.adding:invocation[0]";
    setClientDetails: "done.invoke.stripePaymentManager.loading.addElement:invocation[0]";
    setContext:
      | "REFRESH"
      | "done.invoke.stripePaymentManager.checking.parsing:invocation[0]"
      | "done.invoke.stripePaymentManager.loading.stripe:invocation[0]";
    setElementStatus: "VALIDATE";
    setElements:
      | "done.invoke.stripePaymentManager.loading.addElement:invocation[0]"
      | "done.invoke.stripePaymentManager.loading.paymentElement:invocation[0]";
    setError:
      | "error.platform.stripePaymentManager.checking.validating:invocation[0]"
      | "error.platform.stripePaymentManager.loading.addElement:invocation[0]"
      | "error.platform.stripePaymentManager.loading.paymentElement:invocation[0]"
      | "error.platform.stripePaymentManager.loading.stripe:invocation[0]";
    setFeedbackError:
      | "error.platform.stripePaymentManager.loading.addElement:invocation[0]"
      | "error.platform.stripePaymentManager.loading.paymentElement:invocation[0]"
      | "error.platform.stripePaymentManager.loading.stripe:invocation[0]";
    setModel:
      | "SET"
      | "done.invoke.stripePaymentManager.checking.parsing:invocation[0]";
    setPaymentDetails: "done.invoke.stripePaymentManager.processing.payment:invocation[0]";
    setSchemas: "done.invoke.stripePaymentManager.checking.parsing:invocation[0]";
    updateStripe: "REFRESH";
  };
  eventsCausingDelays: {
    wait:
      | "done.invoke.stripePaymentManager.processing.adding:invocation[0]"
      | "done.invoke.stripePaymentManager.processing.payment:invocation[0]";
  };
  eventsCausingGuards: {
    hasNoOutstandingBalance: "xstate.after(wait)#processed";
    isAdding: "done.invoke.stripePaymentManager.loading.stripe:invocation[0]";
  };
  eventsCausingServices: {
    confirmSetup: "ADD";
    createAddElement: "done.invoke.stripePaymentManager.loading.stripe:invocation[0]";
    createPaymentElement: "done.invoke.stripePaymentManager.loading.stripe:invocation[0]";
    load:
      | "CLEAR"
      | "REFRESH"
      | "SET"
      | "UNAUTHENTICATED"
      | "VALIDATE"
      | "xstate.init";
    parse: "CLEAR" | "REFRESH" | "SET" | "VALIDATE";
    update: "CHECKOUT" | "PAY";
    validate:
      | "VALIDATE"
      | "done.invoke.stripePaymentManager.checking.parsing:invocation[0]";
  };
  matchesStates:
    | "checking"
    | "checking.parsing"
    | "checking.validating"
    | "complete"
    | "error"
    | "invalid"
    | "loading"
    | "loading.addElement"
    | "loading.paymentElement"
    | "loading.stripe"
    | "processed"
    | "processing"
    | "processing.adding"
    | "processing.payment"
    | "valid"
    | {
        checking?: "parsing" | "validating";
        loading?: "addElement" | "paymentElement" | "stripe";
        processing?: "adding" | "payment";
      };
  tags: never;
}
