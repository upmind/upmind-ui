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
    "done.invoke.productConfigurator.configuring.quantity:invocation[0]": {
      type: "done.invoke.productConfigurator.configuring.quantity:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.productConfigurator.configuring.values.attributes.checking:invocation[0]": {
      type: "done.invoke.productConfigurator.configuring.values.attributes.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.productConfigurator.configuring.values.options.checking:invocation[0]": {
      type: "done.invoke.productConfigurator.configuring.values.options.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.productConfigurator.configuring.values.provisioning.checking:invocation[0]": {
      type: "done.invoke.productConfigurator.configuring.values.provisioning.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.productConfigurator.configuring.values.term.checking:invocation[0]": {
      type: "done.invoke.productConfigurator.configuring.values.term.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.calculating:invocation[0]": {
      type: "error.platform.calculating:invocation[0]";
      data: unknown;
    };
    "error.platform.load": { type: "error.platform.load"; data: unknown };
    "error.platform.productConfigurator.configuring.quantity:invocation[0]": {
      type: "error.platform.productConfigurator.configuring.quantity:invocation[0]";
      data: unknown;
    };
    "error.platform.productConfigurator.configuring.values.attributes.checking:invocation[0]": {
      type: "error.platform.productConfigurator.configuring.values.attributes.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.productConfigurator.configuring.values.options.checking:invocation[0]": {
      type: "error.platform.productConfigurator.configuring.values.options.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.productConfigurator.configuring.values.provisioning.checking:invocation[0]": {
      type: "error.platform.productConfigurator.configuring.values.provisioning.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.productConfigurator.configuring.values.term.checking:invocation[0]": {
      type: "error.platform.productConfigurator.configuring.values.term.checking:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    calculateSummary: "done.invoke.calculating:invocation[0]";
    checkAttributes: "done.invoke.productConfigurator.configuring.values.attributes.checking:invocation[0]";
    checkOptions: "done.invoke.productConfigurator.configuring.values.options.checking:invocation[0]";
    checkProvisioning: "done.invoke.productConfigurator.configuring.values.provisioning.checking:invocation[0]";
    checkQuantity: "done.invoke.productConfigurator.configuring.quantity:invocation[0]";
    checkTerm: "done.invoke.productConfigurator.configuring.values.term.checking:invocation[0]";
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
    mergeModel: "PUT";
    sendConfig:
      | "PROCESSING"
      | "done.state.configuring"
      | "done.state.productConfigurator.configuring.values";
    setAttributes:
      | "UPDATE.ATTRIBUTES"
      | "done.invoke.productConfigurator.configuring.values.attributes.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.values.attributes.checking:invocation[0]";
    setClean: "REFRESH";
    setConfig:
      | "PROCESSING"
      | "done.invoke.productConfigurator.configuring.quantity:invocation[0]"
      | "done.invoke.productConfigurator.configuring.values.attributes.checking:invocation[0]"
      | "done.invoke.productConfigurator.configuring.values.options.checking:invocation[0]"
      | "done.invoke.productConfigurator.configuring.values.provisioning.checking:invocation[0]"
      | "done.invoke.productConfigurator.configuring.values.term.checking:invocation[0]"
      | "done.state.configuring"
      | "done.state.productConfigurator.configuring.values"
      | "error.platform.productConfigurator.configuring.values.attributes.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.values.options.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.values.provisioning.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.values.term.checking:invocation[0]";
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
      | "error.platform.productConfigurator.configuring.quantity:invocation[0]"
      | "error.platform.productConfigurator.configuring.values.attributes.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.values.options.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.values.provisioning.checking:invocation[0]";
    setLookups: "done.invoke.load";
    setModel: "REFRESH" | "UPDATE";
    setOptions:
      | "UPDATE.OPTIONS"
      | "done.invoke.productConfigurator.configuring.values.options.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.values.options.checking:invocation[0]";
    setPromotions: "REFRESH";
    setProvisioning:
      | "UPDATE.PROVISIONING"
      | "done.invoke.productConfigurator.configuring.values.provisioning.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.values.provisioning.checking:invocation[0]";
    setQuantity:
      | "UPDATE.QUANTITY"
      | "done.invoke.productConfigurator.configuring.quantity:invocation[0]";
    setSummary: "done.invoke.calculating:invocation[0]";
    setTerm:
      | "UPDATE.TERM"
      | "done.invoke.productConfigurator.configuring.values.term.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.values.term.checking:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    hasCalculated: "";
    hasChanged: "PUT" | "REFRESH";
    needsRecalculating: "" | "done.state.configuring";
  };
  eventsCausingServices: {
    calculateSummary: "" | "done.state.configuring";
    checkAttributes:
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.TERM"
      | "done.invoke.productConfigurator.configuring.quantity:invocation[0]"
      | "done.state.configuring";
    checkOptions:
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.TERM"
      | "done.invoke.productConfigurator.configuring.quantity:invocation[0]"
      | "done.state.configuring";
    checkProvisioning:
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.TERM"
      | "done.invoke.productConfigurator.configuring.quantity:invocation[0]"
      | "done.state.configuring";
    checkQuantity:
      | "PUT"
      | "REFRESH"
      | "UPDATE"
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM"
      | "done.invoke.load"
      | "done.state.configuring";
    checkTerm:
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.TERM"
      | "done.invoke.productConfigurator.configuring.quantity:invocation[0]"
      | "done.state.configuring";
    load: "BIN" | "REFRESH" | "xstate.init";
  };
  matchesStates:
    | "complete"
    | "configured"
    | "configured.error"
    | "configured.idle"
    | "configured.processing"
    | "configuring"
    | "configuring.quantity"
    | "configuring.values"
    | "configuring.values.attributes"
    | "configuring.values.attributes.checking"
    | "configuring.values.attributes.invalid"
    | "configuring.values.attributes.valid"
    | "configuring.values.options"
    | "configuring.values.options.checking"
    | "configuring.values.options.invalid"
    | "configuring.values.options.valid"
    | "configuring.values.provisioning"
    | "configuring.values.provisioning.checking"
    | "configuring.values.provisioning.invalid"
    | "configuring.values.provisioning.valid"
    | "configuring.values.summary"
    | "configuring.values.summary.calculating"
    | "configuring.values.summary.complete"
    | "configuring.values.summary.error"
    | "configuring.values.summary.idle"
    | "configuring.values.term"
    | "configuring.values.term.checking"
    | "configuring.values.term.invalid"
    | "configuring.values.term.valid"
    | "error"
    | "loading"
    | "unavailable"
    | {
        configured?: "error" | "idle" | "processing";
        configuring?:
          | "quantity"
          | "values"
          | {
              values?:
                | "attributes"
                | "options"
                | "provisioning"
                | "summary"
                | "term"
                | {
                    attributes?: "checking" | "invalid" | "valid";
                    options?: "checking" | "invalid" | "valid";
                    provisioning?: "checking" | "invalid" | "valid";
                    summary?: "calculating" | "complete" | "error" | "idle";
                    term?: "checking" | "invalid" | "valid";
                  };
            };
      };
  tags: never;
}
