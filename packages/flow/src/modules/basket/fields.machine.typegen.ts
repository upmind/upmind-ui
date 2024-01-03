// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.basketFields.checking:invocation[0]": {
      type: "done.invoke.basketFields.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.basketFields.loading:invocation[0]": {
      type: "done.invoke.basketFields.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.basketFields.checking:invocation[0]": {
      type: "error.platform.basketFields.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.basketFields.loading:invocation[0]": {
      type: "error.platform.basketFields.loading:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    getCustomFields: "done.invoke.basketFields.loading:invocation[0]";
    validateFields: "done.invoke.basketFields.checking:invocation[0]";
  };
  missingImplementations: {
    actions: "setClean" | "setValues";
    delays: never;
    guards: never;
    services: "getCustomFields" | "validateFields";
  };
  eventsCausingActions: {
    clearError: "" | "INPUT";
    clearModel: "RESET";
    escalateError:
      | "error.platform.basketFields.checking:invocation[0]"
      | "error.platform.basketFields.loading:invocation[0]";
    sendValues: "SUBMIT" | "done.invoke.basketFields.checking:invocation[0]";
    setClean: "REFRESH";
    setCustomFields: "done.invoke.basketFields.loading:invocation[0]";
    setError:
      | "error.platform.basketFields.checking:invocation[0]"
      | "error.platform.basketFields.loading:invocation[0]";
    setModel: "INPUT";
    setSchemas: "done.invoke.basketFields.loading:invocation[0]";
    setValues: "REFRESH";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    isDirty: "";
  };
  eventsCausingServices: {
    getCustomFields: "INPUT" | "REFRESH" | "RESET" | "xstate.init";
    validateFields: "" | "INPUT";
  };
  matchesStates:
    | "checking"
    | "complete"
    | "error"
    | "idle"
    | "invalid"
    | "loading"
    | "valid";
  tags: never;
}
