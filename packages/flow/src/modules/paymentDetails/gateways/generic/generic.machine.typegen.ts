// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.stripePaymentManager.processing:invocation[0]": {
      type: "done.invoke.stripePaymentManager.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.stripePaymentManager.loading:invocation[0]": {
      type: "error.platform.stripePaymentManager.loading:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    load: "done.invoke.stripePaymentManager.loading:invocation[0]";
    makePayment: "done.invoke.stripePaymentManager.processing:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "load" | "makePayment";
  };
  eventsCausingActions: {
    clearError: "CHECKOUT" | "RETRY";
    providePaymentDetails: "done.invoke.stripePaymentManager.processing:invocation[0]";
    setError: "error.platform.stripePaymentManager.loading:invocation[0]";
    setFeedbackError: "error.platform.stripePaymentManager.loading:invocation[0]";
    setFeedbackSuccess: "done.invoke.stripePaymentManager.processing:invocation[0]";
    setPaymentDetails: "done.invoke.stripePaymentManager.processing:invocation[0]";
  };
  eventsCausingDelays: {
    wait: "done.invoke.stripePaymentManager.processing:invocation[0]";
  };
  eventsCausingGuards: {
    hasNoOutstandingBalance: "xstate.after(wait)#processed";
  };
  eventsCausingServices: {
    load: "xstate.init";
    makePayment: "CHECKOUT" | "RETRY";
  };
  matchesStates:
    | "complete"
    | "error"
    | "idle"
    | "loading"
    | "processed"
    | "processing";
  tags: never;
}
