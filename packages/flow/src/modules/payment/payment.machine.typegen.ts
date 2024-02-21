// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.paymentManager.loading:invocation[0]": {
      type: "done.invoke.paymentManager.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.paymentManager.processing.stripe:invocation[0]": {
      type: "done.invoke.paymentManager.processing.stripe:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.paymentManager.loading:invocation[0]": {
      type: "error.platform.paymentManager.loading:invocation[0]";
      data: unknown;
    };
    "error.platform.paymentManager.processing.stripe:invocation[0]": {
      type: "error.platform.paymentManager.processing.stripe:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    loadOrder: "done.invoke.paymentManager.loading:invocation[0]";
    "src of the sub machine type, eg: Stripe": "done.invoke.paymentManager.processing.stripe:invocation[0]";
  };
  missingImplementations: {
    actions: "setOrder";
    delays: never;
    guards: never;
    services: "loadOrder" | "src of the sub machine type, eg: Stripe";
  };
  eventsCausingActions: {
    clearError: "PAY" | "PAYMENT" | "RETRY";
    setError:
      | "error.platform.paymentManager.loading:invocation[0]"
      | "error.platform.paymentManager.processing.stripe:invocation[0]";
    setFeedbackError:
      | "error.platform.paymentManager.loading:invocation[0]"
      | "error.platform.paymentManager.processing.stripe:invocation[0]";
    setFeedbackSuccess: "done.invoke.paymentManager.processing.stripe:invocation[0]";
    setOrder: "done.invoke.paymentManager.loading:invocation[0]";
  };
  eventsCausingDelays: {
    wait: "done.invoke.paymentManager.processing.stripe:invocation[0]";
  };
  eventsCausingGuards: {
    hasNoOutstandingBalance: "xstate.after(wait)#processed";
    isStripePayment: "";
  };
  eventsCausingServices: {
    loadOrder: "xstate.init";
    "src of the sub machine type, eg: Stripe": "";
  };
  matchesStates:
    | "complete"
    | "error"
    | "idle"
    | "loading"
    | "processed"
    | "processing"
    | "processing.checking"
    | "processing.stripe"
    | { processing?: "checking" | "stripe" };
  tags: never;
}
