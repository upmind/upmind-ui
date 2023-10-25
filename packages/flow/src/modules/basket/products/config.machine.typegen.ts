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
    "done.invoke.productConfigurator.configuring.options.checking:invocation[0]": {
      type: "done.invoke.productConfigurator.configuring.options.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.productConfigurator.configuring.quantity.checking:invocation[0]": {
      type: "done.invoke.productConfigurator.configuring.quantity.checking:invocation[0]";
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
    "error.platform.productConfigurator.configuring.options.checking:invocation[0]": {
      type: "error.platform.productConfigurator.configuring.options.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.productConfigurator.configuring.quantity.checking:invocation[0]": {
      type: "error.platform.productConfigurator.configuring.quantity.checking:invocation[0]";
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
    checkOptions: "done.invoke.productConfigurator.configuring.options.checking:invocation[0]";
    checkQuantity: "done.invoke.productConfigurator.configuring.quantity.checking:invocation[0]";
    checkTerm: "done.invoke.productConfigurator.configuring.term.checking:invocation[0]";
    getProduct: "done.invoke.load";
  };
  missingImplementations: {
    actions: "setValues";
    delays: never;
    guards: never;
    services:
      | "checkAttributes"
      | "checkOptions"
      | "checkQuantity"
      | "checkTerm"
      | "getProduct";
  };
  eventsCausingActions: {
    sendConfig: "done.state.configuring";
    setAttributes:
      | "UPDATE.ATTRIBUTES"
      | "done.invoke.productConfigurator.configuring.attributes.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.attributes.checking:invocation[0]";
    setAvailable: "done.invoke.load";
    setConfig: "done.state.configuring";
    setError:
      | "error.platform.load"
      | "error.platform.productConfigurator.configuring.attributes.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.options.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.quantity.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.term.checking:invocation[0]";
    setOptions:
      | "done.invoke.productConfigurator.configuring.options.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.options.checking:invocation[0]";
    setQuantity:
      | "UPDATE.QUANTITY"
      | "done.invoke.productConfigurator.configuring.quantity.checking:invocation[0]";
    setTerm:
      | "UPDATE.TERM"
      | "done.invoke.productConfigurator.configuring.term.checking:invocation[0]";
    setValues: "UPDATE";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {
    checkAttributes: "UPDATE" | "UPDATE.ATTRIBUTES" | "done.invoke.load";
    checkOptions: "UPDATE" | "UPDATE.OPTIONS" | "done.invoke.load";
    checkQuantity: "UPDATE" | "UPDATE.QUANTITY" | "done.invoke.load";
    checkTerm: "UPDATE" | "UPDATE.TERM" | "done.invoke.load";
    getProduct: "xstate.init";
  };
  matchesStates:
    | "complete"
    | "configured"
    | "configuring"
    | "configuring.attributes"
    | "configuring.attributes.checking"
    | "configuring.attributes.error"
    | "configuring.attributes.invalid"
    | "configuring.attributes.processing"
    | "configuring.attributes.valid"
    | "configuring.options"
    | "configuring.options.checking"
    | "configuring.options.error"
    | "configuring.options.invalid"
    | "configuring.options.processing"
    | "configuring.options.valid"
    | "configuring.quantity"
    | "configuring.quantity.checking"
    | "configuring.quantity.error"
    | "configuring.quantity.invalid"
    | "configuring.quantity.processing"
    | "configuring.quantity.valid"
    | "configuring.term"
    | "configuring.term.checking"
    | "configuring.term.error"
    | "configuring.term.invalid"
    | "configuring.term.processing"
    | "configuring.term.valid"
    | "error"
    | "loading"
    | {
        configuring?:
          | "attributes"
          | "options"
          | "quantity"
          | "term"
          | {
              attributes?:
                | "checking"
                | "error"
                | "invalid"
                | "processing"
                | "valid";
              options?:
                | "checking"
                | "error"
                | "invalid"
                | "processing"
                | "valid";
              quantity?:
                | "checking"
                | "error"
                | "invalid"
                | "processing"
                | "valid";
              term?: "checking" | "error" | "invalid" | "processing" | "valid";
            };
      };
  tags: never;
}
