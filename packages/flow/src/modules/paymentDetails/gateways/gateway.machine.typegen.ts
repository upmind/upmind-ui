// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.gatewayPaymentManager.checking.parsing:invocation[0]": {
      type: "done.invoke.gatewayPaymentManager.checking.parsing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.gatewayPaymentManager.loading:invocation[0]": {
      type: "done.invoke.gatewayPaymentManager.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.gatewayPaymentManager.processing:invocation[0]": {
      type: "done.invoke.gatewayPaymentManager.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.gatewayPaymentManager.checking.validating:invocation[0]": {
      type: "error.platform.gatewayPaymentManager.checking.validating:invocation[0]";
      data: unknown;
    };
    "error.platform.gatewayPaymentManager.loading:invocation[0]": {
      type: "error.platform.gatewayPaymentManager.loading:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    load: "done.invoke.gatewayPaymentManager.loading:invocation[0]";
    parse: "done.invoke.gatewayPaymentManager.checking.parsing:invocation[0]";
    update: "done.invoke.gatewayPaymentManager.processing:invocation[0]";
    validate: "done.invoke.gatewayPaymentManager.checking.validating:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "load" | "parse" | "update" | "validate";
  };
  eventsCausingActions: {
    clearError:
      | "CHECKOUT"
      | "CLEAR"
      | "PAY"
      | "RETRY"
      | "SET"
      | "UNAUTHENTICATED"
      | "done.invoke.gatewayPaymentManager.loading:invocation[0]";
    clearModel: "CLEAR" | "UNAUTHENTICATED";
    clearSchemas: "UNAUTHENTICATED";
    providePaymentDetails: "done.invoke.gatewayPaymentManager.processing:invocation[0]";
    setContext: "done.invoke.gatewayPaymentManager.checking.parsing:invocation[0]";
    setError:
      | "error.platform.gatewayPaymentManager.checking.validating:invocation[0]"
      | "error.platform.gatewayPaymentManager.loading:invocation[0]";
    setFeedbackError: "error.platform.gatewayPaymentManager.loading:invocation[0]";
    setModel:
      | "SET"
      | "done.invoke.gatewayPaymentManager.checking.parsing:invocation[0]";
    setPaymentDetails: "done.invoke.gatewayPaymentManager.processing:invocation[0]";
    setSchemas: "done.invoke.gatewayPaymentManager.checking.parsing:invocation[0]";
  };
  eventsCausingDelays: {
    wait: "done.invoke.gatewayPaymentManager.processing:invocation[0]";
  };
  eventsCausingGuards: {
    hasNoOutstandingBalance: "xstate.after(wait)#processed";
  };
  eventsCausingServices: {
    load: "CLEAR" | "SET" | "UNAUTHENTICATED" | "xstate.init";
    parse:
      | "CLEAR"
      | "SET"
      | "done.invoke.gatewayPaymentManager.loading:invocation[0]";
    update: "CHECKOUT" | "PAY" | "RETRY";
    validate: "done.invoke.gatewayPaymentManager.checking.parsing:invocation[0]";
  };
  matchesStates:
    | "checking"
    | "checking.parsing"
    | "checking.validating"
    | "complete"
    | "error"
    | "invalid"
    | "loading"
    | "processed"
    | "processing"
    | "valid"
    | { checking?: "parsing" | "validating" };
  tags: never;
}
