// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.paymentDetailsManager.available.details.checking.parsing:invocation[0]": {
      type: "done.invoke.paymentDetailsManager.available.details.checking.parsing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.paymentDetailsManager.loading:invocation[0]": {
      type: "done.invoke.paymentDetailsManager.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.paymentDetailsManager.available.details.checking.validating:invocation[0]": {
      type: "error.platform.paymentDetailsManager.available.details.checking.validating:invocation[0]";
      data: unknown;
    };
    "error.platform.paymentDetailsManager.loading:invocation[0]": {
      type: "error.platform.paymentDetailsManager.loading:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    load: "done.invoke.paymentDetailsManager.loading:invocation[0]";
    parse: "done.invoke.paymentDetailsManager.available.details.checking.parsing:invocation[0]";
    validate: "done.invoke.paymentDetailsManager.available.details.checking.validating:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "load" | "parse" | "validate";
  };
  eventsCausingActions: {
    clearError:
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
      | "done.invoke.paymentDetailsManager.available.details.checking.parsing:invocation[0]"
      | "done.invoke.paymentDetailsManager.loading:invocation[0]";
    setDirty: "CLEAR" | "SET";
    setError:
      | "error.platform.paymentDetailsManager.available.details.checking.validating:invocation[0]"
      | "error.platform.paymentDetailsManager.loading:invocation[0]";
    setFeedbackError: "error.platform.paymentDetailsManager.loading:invocation[0]";
    setModel: "SET";
    setSchemas:
      | "REFRESH"
      | "done.invoke.paymentDetailsManager.available.details.checking.parsing:invocation[0]"
      | "done.invoke.paymentDetailsManager.loading:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {
    load: "CLEAR" | "REFRESH" | "SET" | "UNAUTHENTICATED" | "xstate.init";
    parse:
      | "CLEAR"
      | "SET"
      | "done.invoke.paymentDetailsManager.loading:invocation[0]";
    validate: "done.invoke.paymentDetailsManager.available.details.checking.parsing:invocation[0]";
  };
  matchesStates:
    | "available"
    | "available.details"
    | "available.details.checking"
    | "available.details.checking.parsing"
    | "available.details.checking.validating"
    | "available.details.invalid"
    | "available.details.valid"
    | "complete"
    | "error"
    | "loading"
    | "valid"
    | {
        available?:
          | "details"
          | {
              details?:
                | "checking"
                | "invalid"
                | "valid"
                | { checking?: "parsing" | "validating" };
            };
      };
  tags: never;
}
