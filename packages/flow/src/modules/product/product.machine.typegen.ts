// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.calculating:invocation[0]": {
      type: "done.invoke.calculating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
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
    "error.platform.calculating:invocation[0]": {
      type: "error.platform.calculating:invocation[0]";
      data: unknown;
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
    calculateSummary: "done.invoke.calculating:invocation[0]";
    checkAttributes: "done.invoke.productConfigurator.configuring.attributes.checking:invocation[0]";
    checkOptions: "done.invoke.productConfigurator.configuring.options.checking:invocation[0]";
    checkProvisioning: "done.invoke.productConfigurator.configuring.provisioning.checking:invocation[0]";
    checkQuantity: "done.invoke.productConfigurator.configuring.quantity.checking:invocation[0]";
    checkTerm: "done.invoke.productConfigurator.configuring.term.checking:invocation[0]";
    load: "done.invoke.load";
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
      | "load";
  };
  eventsCausingActions: {
    clearCalculating: "done.invoke.calculating:invocation[0]";
    clearError: "CLEAR.ERRORS";
    mergeValues: "PUT";
    sendConfig: "PROCESSING" | "done.state.configuring";
    setAttributes:
      | "UPDATE.ATTRIBUTES"
      | "done.invoke.productConfigurator.configuring.attributes.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.attributes.checking:invocation[0]";
    setAvailable: "done.invoke.load";
    setCalculating: "UPDATE.QUANTITY";
    setClean: "REFRESH";
    setConfig:
      | "PROCESSING"
      | "done.invoke.productConfigurator.configuring.attributes.checking:invocation[0]"
      | "done.invoke.productConfigurator.configuring.options.checking:invocation[0]"
      | "done.invoke.productConfigurator.configuring.provisioning.checking:invocation[0]"
      | "done.invoke.productConfigurator.configuring.quantity.checking:invocation[0]"
      | "done.invoke.productConfigurator.configuring.term.checking:invocation[0]"
      | "done.state.configuring"
      | "error.platform.productConfigurator.configuring.attributes.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.options.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.provisioning.checking:invocation[0]";
    setCurrency: "REFRESH";
    setDirty:
      | "PUT"
      | "UPDATE"
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM";
    setError:
      | "ERROR"
      | "error.platform.calculating:invocation[0]"
      | "error.platform.load"
      | "error.platform.productConfigurator.configuring.attributes.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.options.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.provisioning.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.quantity.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.term.checking:invocation[0]";
    setOptions:
      | "UPDATE.OPTIONS"
      | "done.invoke.productConfigurator.configuring.options.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.options.checking:invocation[0]";
    setPromotions: "REFRESH";
    setProvisioning:
      | "UPDATE.PROVISIONING"
      | "done.invoke.productConfigurator.configuring.provisioning.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.provisioning.checking:invocation[0]";
    setQuantity:
      | "UPDATE.QUANTITY"
      | "done.invoke.productConfigurator.configuring.quantity.checking:invocation[0]";
    setSummary: "done.invoke.calculating:invocation[0]";
    setTerm:
      | "UPDATE.TERM"
      | "done.invoke.productConfigurator.configuring.term.checking:invocation[0]";
    setValues: "UPDATE";
  };
  eventsCausingDelays: {
    error: "ERROR" | "error.platform.load";
  };
  eventsCausingGuards: {
    hasChanged: "PUT" | "REFRESH";
    isNewCurrency: "REFRESH";
    needsRecalculating: "" | "done.state.configuring";
  };
  eventsCausingServices: {
    calculateSummary: "" | "done.state.configuring";
    checkAttributes:
      | "PUT"
      | "UPDATE"
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM"
      | "done.invoke.load"
      | "done.state.configuring"
      | "xstate.after(error)#error";
    checkOptions:
      | "PUT"
      | "UPDATE"
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM"
      | "done.invoke.load"
      | "done.state.configuring"
      | "xstate.after(error)#error";
    checkProvisioning:
      | "PUT"
      | "UPDATE"
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM"
      | "done.invoke.load"
      | "done.state.configuring"
      | "xstate.after(error)#error";
    checkQuantity:
      | "PUT"
      | "UPDATE"
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM"
      | "done.invoke.load"
      | "done.state.configuring"
      | "xstate.after(error)#error";
    checkTerm:
      | "PUT"
      | "UPDATE"
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM"
      | "done.invoke.load"
      | "done.state.configuring"
      | "xstate.after(error)#error";
    load: "BIN" | "ERROR" | "REFRESH" | "xstate.init";
  };
  matchesStates:
    | "complete"
    | "configured"
    | "configured.idle"
    | "configured.processing"
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
    | "configuring.summary"
    | "configuring.summary.calculating"
    | "configuring.summary.complete"
    | "configuring.summary.idle"
    | "configuring.term"
    | "configuring.term.checking"
    | "configuring.term.invalid"
    | "configuring.term.valid"
    | "error"
    | "loading"
    | "unavailable"
    | {
        configured?: "idle" | "processing";
        configuring?:
          | "attributes"
          | "options"
          | "provisioning"
          | "quantity"
          | "summary"
          | "term"
          | {
              attributes?: "checking" | "invalid" | "valid";
              options?: "checking" | "invalid" | "valid";
              provisioning?: "checking" | "invalid" | "valid";
              quantity?: "checking" | "invalid" | "valid";
              summary?: "calculating" | "complete" | "idle";
              term?: "checking" | "invalid" | "valid";
            };
      };
  tags: never;
}
