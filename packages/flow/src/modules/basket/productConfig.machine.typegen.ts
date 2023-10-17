// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.load": {
      type: "done.invoke.load";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.productConfigurator.configuring.attributes.checking:invocation[0]": {
      type: "done.invoke.productConfigurator.configuring.attributes.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.productConfigurator.configuring.term.checking:invocation[0]": {
      type: "done.invoke.productConfigurator.configuring.term.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.load": { type: "error.platform.load"; data: unknown };
    "error.platform.productConfigurator.configuring.attributes.checking:invocation[0]": {
      type: "error.platform.productConfigurator.configuring.attributes.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.productConfigurator.configuring.term.checking:invocation[0]": {
      type: "error.platform.productConfigurator.configuring.term.checking:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    checkAttributes: "done.invoke.productConfigurator.configuring.attributes.checking:invocation[0]";
    checkTerm: "done.invoke.productConfigurator.configuring.term.checking:invocation[0]";
    getProduct: "done.invoke.load";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "checkAttributes" | "checkTerm" | "getProduct";
  };
  eventsCausingActions: {
    setAttributes: "done.invoke.productConfigurator.configuring.attributes.checking:invocation[0]";
    setAvailable: "done.invoke.load";
    setConfig: "done.invoke.load";
    setError:
      | "error.platform.load"
      | "error.platform.productConfigurator.configuring.attributes.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.term.checking:invocation[0]";
    setProduct: "done.invoke.load";
    setTerm: "done.invoke.productConfigurator.configuring.term.checking:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {
    checkAttributes: "done.invoke.load";
    checkTerm: "done.invoke.load";
    getProduct: "xstate.init";
  };
  matchesStates:
    | "complete"
    | "configuring"
    | "configuring.attributes"
    | "configuring.attributes.checking"
    | "configuring.attributes.complete"
    | "configuring.attributes.error"
    | "configuring.attributes.incomplete"
    | "configuring.attributes.processing"
    | "configuring.term"
    | "configuring.term.checking"
    | "configuring.term.complete"
    | "configuring.term.error"
    | "configuring.term.incomplete"
    | "configuring.term.processing"
    | "error"
    | "loading"
    | {
        configuring?:
          | "attributes"
          | "term"
          | {
              attributes?:
                | "checking"
                | "complete"
                | "error"
                | "incomplete"
                | "processing";
              term?:
                | "checking"
                | "complete"
                | "error"
                | "incomplete"
                | "processing";
            };
      };
  tags: never;
}
