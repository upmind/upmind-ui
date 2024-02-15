// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.stripePaymentManager.processing:invocation[0]": {
      type: "done.invoke.stripePaymentManager.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.stripePaymentManager.processing:invocation[0]": {
      type: "error.platform.stripePaymentManager.processing:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    "src of the sub machine type, eg: Stripe": "done.invoke.stripePaymentManager.processing:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "src of the sub machine type, eg: Stripe";
  };
  eventsCausingActions: {
    clearError: "RETRY";
    setError: "error.platform.stripePaymentManager.processing:invocation[0]";
    setFeedbackError: "error.platform.stripePaymentManager.processing:invocation[0]";
    setFeedbackSuccess: "done.invoke.stripePaymentManager.processing:invocation[0]";
  };
  eventsCausingDelays: {
    wait: "done.invoke.stripePaymentManager.processing:invocation[0]";
  };
  eventsCausingGuards: {
    hasNoOutstandingBalance: "xstate.after(wait)#processed";
  };
  eventsCausingServices: {
    "src of the sub machine type, eg: Stripe": "RETRY";
  };
  matchesStates: "complete" | "error" | "loading" | "processed" | "processing";
  tags: never;
}
