// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
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
    "done.invoke.stripePaymentManager.processing.payment:invocation[0]": {
      type: "done.invoke.stripePaymentManager.processing.payment:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.stripePaymentManager.processing.payment_method:invocation[0]": {
      type: "done.invoke.stripePaymentManager.processing.payment_method:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
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
    confirmSetup: "done.invoke.stripePaymentManager.processing.payment_method:invocation[0]";
    createAddElement: "done.invoke.stripePaymentManager.loading.addElement:invocation[0]";
    createPaymentElement: "done.invoke.stripePaymentManager.loading.paymentElement:invocation[0]";
    load: "done.invoke.stripePaymentManager.loading.stripe:invocation[0]";
    makePayment: "done.invoke.stripePaymentManager.processing.payment:invocation[0]";
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
      | "makePayment";
  };
  eventsCausingActions: {
    clearError: "ADD" | "CHECKOUT" | "PAY" | "RETRY";
    provideElements: "done.invoke.stripePaymentManager.loading.paymentElement:invocation[0]";
    set: "done.invoke.stripePaymentManager.processing.payment_method:invocation[0]";
    setClientDetails: "done.invoke.stripePaymentManager.loading.addElement:invocation[0]";
    setElements:
      | "done.invoke.stripePaymentManager.loading.addElement:invocation[0]"
      | "done.invoke.stripePaymentManager.loading.paymentElement:invocation[0]";
    setError:
      | "error.platform.stripePaymentManager.loading.addElement:invocation[0]"
      | "error.platform.stripePaymentManager.loading.paymentElement:invocation[0]"
      | "error.platform.stripePaymentManager.loading.stripe:invocation[0]";
    setFeedbackError:
      | "error.platform.stripePaymentManager.loading.addElement:invocation[0]"
      | "error.platform.stripePaymentManager.loading.paymentElement:invocation[0]"
      | "error.platform.stripePaymentManager.loading.stripe:invocation[0]";
    setFeedbackSuccess:
      | "done.invoke.stripePaymentManager.processing.payment:invocation[0]"
      | "done.invoke.stripePaymentManager.processing.payment_method:invocation[0]";
    setPaymentData: "done.invoke.stripePaymentManager.processing.payment:invocation[0]";
    setStripeInstance: "done.invoke.stripePaymentManager.loading.stripe:invocation[0]";
  };
  eventsCausingDelays: {
    wait:
      | "done.invoke.stripePaymentManager.processing.payment:invocation[0]"
      | "done.invoke.stripePaymentManager.processing.payment_method:invocation[0]";
  };
  eventsCausingGuards: {
    hasNoOutstandingBalance: "xstate.after(wait)#processed";
    isAddingPaymentMethod: "done.invoke.stripePaymentManager.loading.stripe:invocation[0]";
  };
  eventsCausingServices: {
    confirmSetup: "ADD";
    createAddElement: "done.invoke.stripePaymentManager.loading.stripe:invocation[0]";
    createPaymentElement: "done.invoke.stripePaymentManager.loading.stripe:invocation[0]";
    load: "xstate.init";
    makePayment: "CHECKOUT" | "PAY";
  };
  matchesStates:
    | "complete"
    | "error"
    | "idle"
    | "loading"
    | "loading.addElement"
    | "loading.paymentElement"
    | "loading.stripe"
    | "processed"
    | "processing"
    | "processing.payment"
    | "processing.payment_method"
    | {
        loading?: "addElement" | "paymentElement" | "stripe";
        processing?: "payment" | "payment_method";
      };
  tags: never;
}
