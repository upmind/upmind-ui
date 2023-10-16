// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.item.configuring.term.checking:invocation[0]": {
      type: "done.invoke.item.configuring.term.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.load": {
      type: "done.invoke.load";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.load": { type: "error.platform.load"; data: unknown };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    checkTerm: "done.invoke.item.configuring.term.checking:invocation[0]";
    getProduct: "done.invoke.load";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "checkTerm" | "getProduct";
  };
  eventsCausingActions: {
    setAvailable: "done.invoke.load";
    setConfig: "done.invoke.load";
    setError: "error.platform.load";
    setProduct: "done.invoke.load";
    setTerm: "done.invoke.item.configuring.term.checking:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {
    checkTerm: "done.invoke.load";
    getProduct: "xstate.init";
  };
  matchesStates:
    | "complete"
    | "configuring"
    | "configuring.term"
    | "configuring.term.checking"
    | "configuring.term.complete"
    | "configuring.term.error"
    | "configuring.term.processing"
    | "configuring.term.required"
    | "error"
    | "loading"
    | "processing"
    | "processing.add"
    | "processing.provision"
    | "processing.update"
    | {
        configuring?:
          | "term"
          | {
              term?:
                | "checking"
                | "complete"
                | "error"
                | "processing"
                | "required";
            };
        processing?: "add" | "provision" | "update";
      };
  tags: never;
}
