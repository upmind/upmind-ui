// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
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
      | "checkAttributes"
      | "checkOptions"
      | "checkProvisioning"
      | "checkQuantity"
      | "checkTerm"
      | "load";
  };
  eventsCausingActions: {
    calculate:
      | "done.invoke.productConfigurator.configuring.values.options.checking:invocation[0]"
      | "done.invoke.productConfigurator.configuring.values.term.checking:invocation[0]";
    mergeModel: "PUT";
    resetModel: "RESET";
    sendConfig:
      | "PROCESSING"
      | "done.state.productConfigurator.configuring.values";
    setAttributes:
      | "UPDATE.ATTRIBUTES"
      | "done.invoke.productConfigurator.configuring.values.attributes.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.values.attributes.checking:invocation[0]";
    setBaseModel: "REFRESH";
    setClean: "REFRESH" | "RESET";
    setConfig:
      | "PROCESSING"
      | "done.state.productConfigurator.configuring.values";
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
      | "error.platform.productConfigurator.configuring.quantity:invocation[0]"
      | "error.platform.productConfigurator.configuring.values.attributes.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.values.options.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.values.provisioning.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.values.term.checking:invocation[0]";
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
    setSummary: "CALCULATED";
    setTerm:
      | "UPDATE.TERM"
      | "done.invoke.productConfigurator.configuring.values.term.checking:invocation[0]"
      | "error.platform.productConfigurator.configuring.values.term.checking:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    hasChanged: "PUT" | "REFRESH";
    needsCalculating:
      | "done.invoke.productConfigurator.configuring.values.options.checking:invocation[0]"
      | "done.invoke.productConfigurator.configuring.values.term.checking:invocation[0]";
  };
  eventsCausingServices: {
    checkAttributes:
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.TERM"
      | "done.invoke.productConfigurator.configuring.quantity:invocation[0]";
    checkOptions:
      | "CALCULATED"
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.TERM"
      | "done.invoke.productConfigurator.configuring.quantity:invocation[0]";
    checkProvisioning:
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.TERM"
      | "done.invoke.productConfigurator.configuring.quantity:invocation[0]";
    checkQuantity:
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
      | "CALCULATED"
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.TERM"
      | "done.invoke.productConfigurator.configuring.quantity:invocation[0]";
    load: "BIN" | "REFRESH" | "RESET" | "xstate.init";
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
    | "configuring.values.options.calculating"
    | "configuring.values.options.checking"
    | "configuring.values.options.invalid"
    | "configuring.values.options.valid"
    | "configuring.values.provisioning"
    | "configuring.values.provisioning.checking"
    | "configuring.values.provisioning.invalid"
    | "configuring.values.provisioning.valid"
    | "configuring.values.term"
    | "configuring.values.term.calculating"
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
                | "term"
                | {
                    attributes?: "checking" | "invalid" | "valid";
                    options?: "calculating" | "checking" | "invalid" | "valid";
                    provisioning?: "checking" | "invalid" | "valid";
                    term?: "calculating" | "checking" | "invalid" | "valid";
                  };
            };
      };
  tags: never;
}
