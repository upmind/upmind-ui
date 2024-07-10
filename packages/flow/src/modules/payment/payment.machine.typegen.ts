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
    "error.platform.paymentManager.approving.redirecting:invocation[0]": {
      type: "error.platform.paymentManager.approving.redirecting:invocation[0]";
      data: unknown;
    };
    "error.platform.paymentManager.checking:invocation[0]": {
      type: "error.platform.paymentManager.checking:invocation[0]";
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
    redirect: "done.invoke.paymentManager.approving.redirecting:invocation[0]";
    update: "done.invoke.paymentManager.processing:invocation[0]";
    validate: "done.invoke.paymentManager.checking:invocation[0]";
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
    setApproval: "xstate.after(wait)#processed";
    setContext: "done.invoke.paymentManager.loading:invocation[0]";
    setError:
      | "error.platform.paymentManager.approving.redirecting:invocation[0]"
      | "error.platform.paymentManager.checking:invocation[0]"
      | "error.platform.paymentManager.loading:invocation[0]"
      | "error.platform.paymentManager.processing:invocation[0]";
    setFeedbackError:
      | "error.platform.paymentManager.approving.redirecting:invocation[0]"
      | "error.platform.paymentManager.loading:invocation[0]"
      | "error.platform.paymentManager.processing:invocation[0]";
    setFeedbackSuccess: "xstate.after(wait)#processed";
    setPayment: "done.invoke.paymentManager.processing:invocation[0]";
  };
  eventsCausingDelays: {
    wait: "done.invoke.paymentManager.processing:invocation[0]";
  };
  eventsCausingGuards: {
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
    | "approving.offsite"
    | "approving.redirecting"
    | "checking"
    | "complete"
    | "error"
    | "invalid"
    | "loading"
    | "processed"
    | "processing"
    | "valid"
    | { approving?: "offsite" | "redirecting" };
  tags: never;
}
