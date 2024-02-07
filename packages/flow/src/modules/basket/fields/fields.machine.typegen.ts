// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.fieldsManager.checking.parsing:invocation[0]": {
      type: "done.invoke.fieldsManager.checking.parsing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.fieldsManager.loading:invocation[0]": {
      type: "done.invoke.fieldsManager.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.fieldsManager.processing:invocation[0]": {
      type: "done.invoke.fieldsManager.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.fieldsManager.checking.validating:invocation[0]": {
      type: "error.platform.fieldsManager.checking.validating:invocation[0]";
      data: unknown;
    };
    "error.platform.fieldsManager.loading:invocation[0]": {
      type: "error.platform.fieldsManager.loading:invocation[0]";
      data: unknown;
    };
    "error.platform.fieldsManager.processing:invocation[0]": {
      type: "error.platform.fieldsManager.processing:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    load: "done.invoke.fieldsManager.loading:invocation[0]";
    parse: "done.invoke.fieldsManager.checking.parsing:invocation[0]";
    update: "done.invoke.fieldsManager.processing:invocation[0]";
    validate: "done.invoke.fieldsManager.checking.validating:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "load" | "parse" | "update" | "validate";
  };
  eventsCausingActions: {
    clearError:
      | "CLEAR"
      | "RETRY"
      | "SET"
      | "UNAUTHENTICATED"
      | "UPDATE"
      | "done.invoke.fieldsManager.loading:invocation[0]"
      | "xstate.init";
    clearModel: "CLEAR" | "UNAUTHENTICATED";
    clearSchemas: "UNAUTHENTICATED";
    setContext:
      | "done.invoke.fieldsManager.checking.parsing:invocation[0]"
      | "done.invoke.fieldsManager.loading:invocation[0]";
    setError:
      | "error.platform.fieldsManager.checking.validating:invocation[0]"
      | "error.platform.fieldsManager.loading:invocation[0]"
      | "error.platform.fieldsManager.processing:invocation[0]";
    setFeedbackError:
      | "error.platform.fieldsManager.loading:invocation[0]"
      | "error.platform.fieldsManager.processing:invocation[0]";
    setFeedbackSuccess: "done.invoke.fieldsManager.processing:invocation[0]";
    setModel: "SET" | "done.invoke.fieldsManager.processing:invocation[0]";
    setSchemas:
      | "done.invoke.fieldsManager.checking.parsing:invocation[0]"
      | "done.invoke.fieldsManager.loading:invocation[0]";
  };
  eventsCausingDelays: {
    wait: "done.invoke.fieldsManager.processing:invocation[0]";
  };
  eventsCausingGuards: {};
  eventsCausingServices: {
    load: "CLEAR" | "SET" | "UNAUTHENTICATED" | "xstate.init";
    parse: "CLEAR" | "SET" | "done.invoke.fieldsManager.loading:invocation[0]";
    update: "RETRY" | "UPDATE";
    validate: "done.invoke.fieldsManager.checking.parsing:invocation[0]";
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
