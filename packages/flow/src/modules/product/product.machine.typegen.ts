// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.load": {
      type: "done.invoke.load";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.productConfigurator.calculating:invocation[0]": {
      type: "done.invoke.productConfigurator.calculating:invocation[0]";
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
    "done.invoke.productConfigurator.configuring.provisioning.checking:invocation[0]": {
      type: "done.invoke.productConfigurator.configuring.provisioning.checking:invocation[0]";
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
    "error.platform.productConfigurator.calculating:invocation[0]": {
      type: "error.platform.productConfigurator.calculating:invocation[0]";
      data: unknown;
    };
    "error.platform.productConfigurator.configuring.attributes.checking:invocation[0]": {
      type: "error.platform.productConfigurator.configuring.attributes.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.productConfigurator.configuring.options.checking:invocation[0]": {
      type: "error.platform.productConfigurator.configuring.options.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.productConfigurator.configuring.provisioning.checking:invocation[0]": {
      type: "error.platform.productConfigurator.configuring.provisioning.checking:invocation[0]";
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
    "xstate.after(error)#error": { type: "xstate.after(error)#error" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    calculateSummary: "done.invoke.productConfigurator.calculating:invocation[0]";
    checkAttributes: "done.invoke.productConfigurator.configuring.attributes.checking:invocation[0]";
    checkOptions: "done.invoke.productConfigurator.configuring.options.checking:invocation[0]";
    checkProvisioning: "done.invoke.productConfigurator.configuring.provisioning.checking:invocation[0]";
    checkQuantity: "done.invoke.productConfigurator.configuring.quantity.checking:invocation[0]";
    checkTerm: "done.invoke.productConfigurator.configuring.term.checking:invocation[0]";
    getProduct: "done.invoke.load";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services:
      | "calculateSummary"
      | "checkAttributes"
      | "checkOptions"
      | "checkProvisioning"
      | "checkQuantity"
      | "checkTerm"
      | "getProduct";
  };
  eventsCausingActions: {
    clearCalculating: "done.invoke.productConfigurator.calculating:invocation[0]";
    clearError: "CLEAR.ERRORS";
    escalateError:
      | "error.platform.load"
      | "error.platform.productConfigurator.calculating:invocation[0]"
      | "error.platform.productConfigurator.configuring.attributes.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.options.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.provisioning.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.quantity.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.term.checking:invocation[0]";
    sendConfig:
      | "done.invoke.productConfigurator.calculating:invocation[0]"
      | "done.state.configuring";
    setAttributes:
      | "UPDATE.ATTRIBUTES"
      | "done.invoke.productConfigurator.configuring.attributes.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.attributes.checking:invocation[0]";
    setAvailable: "done.invoke.load";
    setCalculating: "UPDATE.OPTIONS" | "UPDATE.QUANTITY" | "UPDATE.TERM";
    setClean: "REFRESH";
    setConfig:
      | "UPDATE.TERM"
      | "done.invoke.productConfigurator.calculating:invocation[0]"
      | "done.invoke.productConfigurator.configuring.attributes.checking:invocation[0]"
      | "done.invoke.productConfigurator.configuring.options.checking:invocation[0]"
      | "done.invoke.productConfigurator.configuring.provisioning.checking:invocation[0]"
      | "done.invoke.productConfigurator.configuring.quantity.checking:invocation[0]"
      | "done.state.configuring"
      | "error.platform.productConfigurator.configuring.attributes.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.options.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.provisioning.checking:invocation[0]";
    setDirty:
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM";
    setError:
      | "ERROR"
      | "error.platform.load"
      | "error.platform.productConfigurator.calculating:invocation[0]"
      | "error.platform.productConfigurator.configuring.attributes.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.options.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.provisioning.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.quantity.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.term.checking:invocation[0]";
    setOptions:
      | "UPDATE.OPTIONS"
      | "done.invoke.productConfigurator.configuring.options.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.options.checking:invocation[0]";
    setProvisioning:
      | "UPDATE.PROVISIONING"
      | "done.invoke.productConfigurator.configuring.provisioning.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.provisioning.checking:invocation[0]";
    setQuantity:
      | "UPDATE.QUANTITY"
      | "done.invoke.productConfigurator.configuring.quantity.checking:invocation[0]";
    setSummary: "done.invoke.productConfigurator.calculating:invocation[0]";
    setTerm:
      | "UPDATE.TERM"
      | "done.invoke.productConfigurator.configuring.term.checking:invocation[0]";
    setValues: "REFRESH";
  };
  eventsCausingDelays: {
    error:
      | "ERROR"
      | "error.platform.load"
      | "error.platform.productConfigurator.calculating:invocation[0]";
  };
  eventsCausingGuards: {
    needsRecalculating: "done.state.configuring";
  };
  eventsCausingServices: {
    calculateSummary: "done.state.configuring";
    checkAttributes:
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM"
      | "done.invoke.load"
      | "xstate.after(error)#error";
    checkOptions:
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM"
      | "done.invoke.load"
      | "xstate.after(error)#error";
    checkProvisioning:
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM"
      | "done.invoke.load"
      | "xstate.after(error)#error";
    checkQuantity:
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM"
      | "done.invoke.load"
      | "xstate.after(error)#error";
    checkTerm:
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM"
      | "done.invoke.load"
      | "xstate.after(error)#error";
    getProduct: "ERROR" | "REFRESH" | "xstate.init";
  };
  matchesStates:
    | "calculating"
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
    | "configuring.provisioning"
    | "configuring.provisioning.checking"
    | "configuring.provisioning.invalid"
    | "configuring.provisioning.valid"
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
          | "provisioning"
          | "quantity"
          | "term"
          | {
              attributes?: "checking" | "invalid" | "valid";
              options?: "checking" | "invalid" | "valid";
              provisioning?: "checking" | "invalid" | "valid";
              quantity?: "checking" | "invalid" | "valid";
              term?: "checking" | "invalid" | "valid";
            };
      };
  tags: never;
}
