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
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
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
      | "checkAttributes"
      | "checkOptions"
      | "checkProvisioning"
      | "checkQuantity"
      | "checkTerm"
      | "load";
  };
  eventsCausingActions: {
    calculate: "CALCULATE";
    mergeModel: "PUT";
    resetModel: "RESET";
    sendConfig: "PROCESSING" | "done.state.configuring";
    setAttributes:
      | "UPDATE.ATTRIBUTES"
      | "done.invoke.productConfigurator.configuring.attributes.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.attributes.checking:invocation[0]";
    setBaseModel: "REFRESH";
    setClean: "REFRESH" | "RESET";
    setConfig: "PROCESSING" | "done.state.configuring";
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
      | "error.platform.load"
      | "error.platform.productConfigurator.configuring.attributes.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.options.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.provisioning.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.quantity.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.term.checking:invocation[0]";
    setLookups: "done.invoke.load";
    setModel: "REFRESH" | "UPDATE";
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
    setSummary: "CALCULATED";
    setTerm:
      | "UPDATE.TERM"
      | "done.invoke.productConfigurator.configuring.term.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.term.checking:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    hasChanged: "PUT" | "REFRESH";
    hasSummary: "CALCULATED";
    needsCalculating:
      | "done.invoke.productConfigurator.configuring.options.checking:invocation[0]"
      | "done.invoke.productConfigurator.configuring.term.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.options.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.term.checking:invocation[0]";
  };
  eventsCausingServices: {
    checkAttributes:
      | "CALCULATE"
      | "CHECK.ATTRIBUTES"
      | "PUT"
      | "REFRESH"
      | "UPDATE"
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM"
      | "done.invoke.load";
    checkOptions:
      | "CALCULATE"
      | "CHECK.OPTIONS"
      | "PUT"
      | "REFRESH"
      | "UPDATE"
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM"
      | "done.invoke.load";
    checkProvisioning:
      | "CALCULATE"
      | "PUT"
      | "REFRESH"
      | "UPDATE"
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM"
      | "done.invoke.load";
    checkQuantity:
      | "CALCULATE"
      | "CHECK.QUANTITY"
      | "PUT"
      | "REFRESH"
      | "UPDATE"
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM"
      | "done.invoke.load";
    checkTerm:
      | "CALCULATE"
      | "CHECK.TERM"
      | "PUT"
      | "REFRESH"
      | "UPDATE"
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM"
      | "done.invoke.load";
    load: "BIN" | "REFRESH" | "RESET" | "xstate.init";
  };
  matchesStates:
    | "complete"
    | "configured"
    | "configured.error"
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
    | "configuring.summary.calculated"
    | "configuring.summary.calculating"
    | "configuring.summary.empty"
    | "configuring.term"
    | "configuring.term.checking"
    | "configuring.term.invalid"
    | "configuring.term.valid"
    | "error"
    | "loading"
    | "unavailable"
    | {
        configured?: "error" | "idle" | "processing";
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
              summary?: "calculated" | "calculating" | "empty";
              term?: "checking" | "invalid" | "valid";
            };
      };
  tags: never;
}
