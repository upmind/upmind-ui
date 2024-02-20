// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.paymentDetailsManager.checking.parsing:invocation[0]": {
      type: "done.invoke.paymentDetailsManager.checking.parsing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.paymentDetailsManager.checking.validating:invocation[0]": {
      type: "done.invoke.paymentDetailsManager.checking.validating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.paymentDetailsManager.loading:invocation[0]": {
      type: "done.invoke.paymentDetailsManager.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.paymentDetailsManager.processing:invocation[0]": {
      type: "done.invoke.paymentDetailsManager.processing:invocation[0]";
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
    "error.platform.paymentDetailsManager.processing:invocation[0]": {
      type: "error.platform.paymentDetailsManager.processing:invocation[0]";
      data: unknown;
    };
    "error.platform.stripe:invocation[0]": {
      type: "error.platform.stripe:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    load: "done.invoke.paymentDetailsManager.loading:invocation[0]";
    parse: "done.invoke.paymentDetailsManager.checking.parsing:invocation[0]";
    stripeMachine: "done.invoke.stripe:invocation[0]";
    update: "done.invoke.paymentDetailsManager.processing:invocation[0]";
    validate: "done.invoke.paymentDetailsManager.checking.validating:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: "isStripe";
    services: "load" | "parse" | "stripeMachine" | "update" | "validate";
  };
  eventsCausingActions: {
    clearDirty: "done.invoke.paymentDetailsManager.processing:invocation[0]";
    clearError:
      | "CHECKOUT"
      | "CLEAR"
      | "REFRESH"
      | "SET"
      | "UNAUTHENTICATED"
      | "done.invoke.paymentDetailsManager.loading:invocation[0]"
      | "xstate.init";
    clearModel: "CLEAR" | "UNAUTHENTICATED";
    clearSchemas: "UNAUTHENTICATED";
    refreshContext: "REFRESH";
    setContext:
      | "done.invoke.paymentDetailsManager.checking.parsing:invocation[0]"
      | "done.invoke.paymentDetailsManager.loading:invocation[0]";
    setDirty: "CLEAR" | "SET";
    setError:
      | "error.platform.paymentDetailsManager.checking.validating:invocation[0]"
      | "error.platform.paymentDetailsManager.loading:invocation[0]"
      | "error.platform.paymentDetailsManager.processing:invocation[0]"
      | "error.platform.stripe:invocation[0]";
    setFeedbackError:
      | "error.platform.paymentDetailsManager.loading:invocation[0]"
      | "error.platform.paymentDetailsManager.processing:invocation[0]"
      | "error.platform.stripe:invocation[0]";
    setFeedbackSuccess: "done.invoke.paymentDetailsManager.processing:invocation[0]";
    setModel:
      | "SET"
      | "done.invoke.paymentDetailsManager.processing:invocation[0]";
    setSchemas:
      | "REFRESH"
      | "done.invoke.paymentDetailsManager.checking.parsing:invocation[0]"
      | "done.invoke.paymentDetailsManager.loading:invocation[0]";
  };
  eventsCausingDelays: {
    wait: "done.invoke.paymentDetailsManager.processing:invocation[0]";
  };
  eventsCausingGuards: {
    isStripe: "SELECT";
    needsGateway: "done.invoke.paymentDetailsManager.checking.validating:invocation[0]";
  };
  eventsCausingServices: {
    load: "CLEAR" | "REFRESH" | "SET" | "UNAUTHENTICATED" | "xstate.init";
    parse:
      | "CLEAR"
      | "SET"
      | "done.invoke.paymentDetailsManager.loading:invocation[0]";
    stripeMachine: "SELECT";
    update: "CHECKOUT";
    validate: "done.invoke.paymentDetailsManager.checking.parsing:invocation[0]";
  };
  matchesStates:
    | "checking"
    | "checking.parsing"
    | "checking.validating"
    | "complete"
    | "error"
    | "invalid"
    | "invalid.details"
    | "invalid.gateway"
    | "invalid.gateway.idle"
    | "invalid.gateway.stripe"
    | "loading"
    | "processed"
    | "processing"
    | "valid"
    | {
        checking?: "parsing" | "validating";
        invalid?: "details" | "gateway" | { gateway?: "idle" | "stripe" };
      };
  tags: never;
}
