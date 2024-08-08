// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.load": {
      type: "done.invoke.load";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.productConfigurator.available.configuring.attributes.checking:invocation[0]": {
      type: "done.invoke.productConfigurator.available.configuring.attributes.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.productConfigurator.available.configuring.options.checking:invocation[0]": {
      type: "done.invoke.productConfigurator.available.configuring.options.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.productConfigurator.available.configuring.provisioning.checking:invocation[0]": {
      type: "done.invoke.productConfigurator.available.configuring.provisioning.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.productConfigurator.available.configuring.quantity.checking:invocation[0]": {
      type: "done.invoke.productConfigurator.available.configuring.quantity.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.productConfigurator.available.configuring.term.checking:invocation[0]": {
      type: "done.invoke.productConfigurator.available.configuring.term.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.load": { type: "error.platform.load"; data: unknown };
    "error.platform.productConfigurator.available.configuring.attributes.checking:invocation[0]": {
      type: "error.platform.productConfigurator.available.configuring.attributes.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.productConfigurator.available.configuring.options.checking:invocation[0]": {
      type: "error.platform.productConfigurator.available.configuring.options.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.productConfigurator.available.configuring.provisioning.checking:invocation[0]": {
      type: "error.platform.productConfigurator.available.configuring.provisioning.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.productConfigurator.available.configuring.quantity.checking:invocation[0]": {
      type: "error.platform.productConfigurator.available.configuring.quantity.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.productConfigurator.available.configuring.term.checking:invocation[0]": {
      type: "error.platform.productConfigurator.available.configuring.term.checking:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    checkAttributes: "done.invoke.productConfigurator.available.configuring.attributes.checking:invocation[0]";
    checkOptions: "done.invoke.productConfigurator.available.configuring.options.checking:invocation[0]";
    checkProvisioning: "done.invoke.productConfigurator.available.configuring.provisioning.checking:invocation[0]";
    checkQuantity: "done.invoke.productConfigurator.available.configuring.quantity.checking:invocation[0]";
    checkTerm: "done.invoke.productConfigurator.available.configuring.term.checking:invocation[0]";
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
      | "done.invoke.productConfigurator.available.configuring.options.checking:invocation[0]"
      | "done.invoke.productConfigurator.available.configuring.term.checking:invocation[0]"
      | "error.platform.productConfigurator.available.configuring.options.checking:invocation[0]"
      | "error.platform.productConfigurator.available.configuring.term.checking:invocation[0]";
    resetModel: "RESET";
    setAttributes:
      | "SET.ATTRIBUTES"
      | "done.invoke.productConfigurator.available.configuring.attributes.checking:invocation[0]"
      | "error.platform.productConfigurator.available.configuring.attributes.checking:invocation[0]";
    setBaseModel: "REFRESH";
    setBasketHelper: "";
    setContext:
      | "ERROR"
      | "PROCESSING"
      | "REFRESH"
      | "REMOVE"
      | "REMOVED"
      | "RESET"
      | "UPDATED"
      | "xstate.init";
    setCurrency: "REFRESH";
    setError:
      | "ERROR"
      | "error.platform.load"
      | "error.platform.productConfigurator.available.configuring.attributes.checking:invocation[0]"
      | "error.platform.productConfigurator.available.configuring.options.checking:invocation[0]"
      | "error.platform.productConfigurator.available.configuring.provisioning.checking:invocation[0]"
      | "error.platform.productConfigurator.available.configuring.quantity.checking:invocation[0]"
      | "error.platform.productConfigurator.available.configuring.term.checking:invocation[0]";
    setLookups: "done.invoke.load";
    setModel: "REFRESH" | "SET";
    setOptions:
      | "SET.OPTIONS"
      | "done.invoke.productConfigurator.available.configuring.options.checking:invocation[0]"
      | "error.platform.productConfigurator.available.configuring.options.checking:invocation[0]";
    setPromotions: "REFRESH";
    setProvisioning:
      | "SET.PROVISIONING"
      | "done.invoke.productConfigurator.available.configuring.provisioning.checking:invocation[0]"
      | "error.platform.productConfigurator.available.configuring.provisioning.checking:invocation[0]";
    setQuantity:
      | "SET.QUANTITY"
      | "done.invoke.productConfigurator.available.configuring.quantity.checking:invocation[0]";
    setSummary: "CALCULATED";
    setSummaryCalculating:
      | "done.invoke.productConfigurator.available.configuring.options.checking:invocation[0]"
      | "done.invoke.productConfigurator.available.configuring.term.checking:invocation[0]"
      | "error.platform.productConfigurator.available.configuring.options.checking:invocation[0]"
      | "error.platform.productConfigurator.available.configuring.term.checking:invocation[0]";
    setTerm:
      | "SET.TERM"
      | "done.invoke.productConfigurator.available.configuring.term.checking:invocation[0]"
      | "error.platform.productConfigurator.available.configuring.term.checking:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    hasChanged: "REFRESH";
    hasSummaryData: "CALCULATED";
    isDirty: "done.state.configuring";
    isNew: "UPDATED";
    needsBasketHelper: "";
    needsCalculating:
      | "done.invoke.productConfigurator.available.configuring.options.checking:invocation[0]"
      | "done.invoke.productConfigurator.available.configuring.term.checking:invocation[0]"
      | "error.platform.productConfigurator.available.configuring.options.checking:invocation[0]"
      | "error.platform.productConfigurator.available.configuring.term.checking:invocation[0]";
  };
  eventsCausingServices: {
    checkAttributes:
      | "CHECK.ATTRIBUTES"
      | "SET"
      | "SET.ATTRIBUTES"
      | "SET.OPTIONS"
      | "SET.PROVISIONING"
      | "SET.QUANTITY"
      | "SET.TERM"
      | "UPDATED"
      | "done.invoke.load";
    checkOptions:
      | "CHECK.OPTIONS"
      | "SET"
      | "SET.ATTRIBUTES"
      | "SET.OPTIONS"
      | "SET.PROVISIONING"
      | "SET.QUANTITY"
      | "SET.TERM"
      | "UPDATED"
      | "done.invoke.load";
    checkProvisioning:
      | "SET"
      | "SET.ATTRIBUTES"
      | "SET.OPTIONS"
      | "SET.PROVISIONING"
      | "SET.QUANTITY"
      | "SET.TERM"
      | "UPDATED"
      | "done.invoke.load";
    checkQuantity:
      | "CHECK.QUANTITY"
      | "SET"
      | "SET.ATTRIBUTES"
      | "SET.OPTIONS"
      | "SET.PROVISIONING"
      | "SET.QUANTITY"
      | "SET.TERM"
      | "UPDATED"
      | "done.invoke.load";
    checkTerm:
      | "CHECK.TERM"
      | "SET"
      | "SET.ATTRIBUTES"
      | "SET.OPTIONS"
      | "SET.PROVISIONING"
      | "SET.QUANTITY"
      | "SET.TERM"
      | "UPDATED"
      | "done.invoke.load";
    load: "" | "REFRESH" | "RESET";
  };
  matchesStates:
    | "available"
    | "available.complete"
    | "available.configured"
    | "available.configuring"
    | "available.configuring.attributes"
    | "available.configuring.attributes.checking"
    | "available.configuring.attributes.invalid"
    | "available.configuring.attributes.valid"
    | "available.configuring.options"
    | "available.configuring.options.checking"
    | "available.configuring.options.invalid"
    | "available.configuring.options.valid"
    | "available.configuring.provisioning"
    | "available.configuring.provisioning.checking"
    | "available.configuring.provisioning.invalid"
    | "available.configuring.provisioning.valid"
    | "available.configuring.quantity"
    | "available.configuring.quantity.checking"
    | "available.configuring.quantity.invalid"
    | "available.configuring.quantity.valid"
    | "available.configuring.term"
    | "available.configuring.term.checking"
    | "available.configuring.term.invalid"
    | "available.configuring.term.valid"
    | "complete"
    | "error"
    | "loading"
    | "processing"
    | "subscribing"
    | {
        available?:
          | "complete"
          | "configured"
          | "configuring"
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
      };
  tags: never;
}
