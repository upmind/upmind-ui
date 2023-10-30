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
    actions: never;
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
    setClean: "REFRESH";
    setConfig: "done.state.configuring";
    setDirty:
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM";
    setError:
      | "error.platform.load"
      | "error.platform.productConfigurator.configuring.attributes.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.options.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.quantity.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.term.checking:invocation[0]";
    setOptions:
      | "UPDATE.OPTIONS"
      | "done.invoke.productConfigurator.configuring.options.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.options.checking:invocation[0]";
    setQuantity:
      | "UPDATE.QUANTITY"
      | "done.invoke.productConfigurator.configuring.quantity.checking:invocation[0]";
    setTerm:
      | "UPDATE.TERM"
      | "done.invoke.productConfigurator.configuring.term.checking:invocation[0]";
    setValues: "REFRESH";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {
    checkAttributes:
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM"
      | "done.invoke.load";
    checkOptions:
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM"
      | "done.invoke.load";
    checkQuantity:
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM"
      | "done.invoke.load";
    checkTerm:
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM"
      | "done.invoke.load";
    getProduct: "REFRESH" | "xstate.init";
  };
  matchesStates:
    | "complete"
    | "configured"
    | "configuring"
    | "configuring.attributes"
    | "configuring.attributes.checking"
    | "configuring.attributes.invalid"
    | "configuring.attributes.valid"
    | "configuring.options"
    | "configuring.options.checking"
    | "configuring.options.invalid"
    | "configuring.options.valid"
    | "configuring.quantity"
    | "configuring.quantity.checking"
    | "configuring.quantity.invalid"
    | "configuring.quantity.valid"
    | "configuring.term"
    | "configuring.term.checking"
    | "configuring.term.invalid"
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
              attributes?: "checking" | "invalid" | "valid";
              options?: "checking" | "invalid" | "valid";
              quantity?: "checking" | "invalid" | "valid";
              term?: "checking" | "invalid" | "valid";
            };
      };
  tags: never;
}
