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
    "done.invoke.paymentManager.processing:invocation[0]": {
      type: "done.invoke.paymentManager.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.checking:invocation[0]": {
      type: "error.platform.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.paymentManager.approving:invocation[0]": {
      type: "error.platform.paymentManager.approving:invocation[0]";
      data: unknown;
    };
    "error.platform.paymentManager.loading:invocation[0]": {
      type: "error.platform.paymentManager.loading:invocation[0]";
      data: unknown;
    };
    "error.platform.paymentManager.processing:invocation[0]": {
      type: "error.platform.paymentManager.processing:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
    "xstate.update": { type: "xstate.update" };
  };
  invokeSrcNameMap: {
    load: "done.invoke.paymentManager.loading:invocation[0]";
    redirect: "done.invoke.paymentManager.approving:invocation[0]";
    update: "done.invoke.paymentManager.processing:invocation[0]";
    validate: "done.invoke.checking:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "load" | "redirect" | "update" | "validate";
  };
  eventsCausingActions: {
    clearError:
      | "done.invoke.paymentManager.loading:invocation[0]"
      | "xstate.update";
    providePayment: "done.invoke.paymentManager.processing:invocation[0]";
    setContext: "done.invoke.paymentManager.loading:invocation[0]";
    setError:
      | "error.platform.checking:invocation[0]"
      | "error.platform.paymentManager.approving:invocation[0]"
      | "error.platform.paymentManager.loading:invocation[0]"
      | "error.platform.paymentManager.processing:invocation[0]";
    setFeedbackError:
      | "error.platform.paymentManager.approving:invocation[0]"
      | "error.platform.paymentManager.loading:invocation[0]"
      | "error.platform.paymentManager.processing:invocation[0]";
    setFeedbackSuccess: "done.invoke.paymentManager.processing:invocation[0]";
    setPayment: "done.invoke.paymentManager.processing:invocation[0]";
  };
  eventsCausingDelays: {
    wait: "done.invoke.paymentManager.processing:invocation[0]";
  };
  eventsCausingGuards: {
    hasNoOutstandingBalance: "xstate.after(wait)#processed";
    hasPaymentDetails: "";
    needsApproval: "xstate.after(wait)#processed";
  };
  eventsCausingServices: {
    load: "xstate.init";
    redirect: "xstate.after(wait)#processed";
    update: "" | "PAY" | "RETRY";
    validate:
      | "done.invoke.paymentManager.loading:invocation[0]"
      | "xstate.update";
  };
  matchesStates:
    | "approving"
    | "checking"
    | "complete"
    | "error"
    | "invalid"
    | "loading"
    | "processed"
    | "processing"
    | "valid";
  tags: never;
}
