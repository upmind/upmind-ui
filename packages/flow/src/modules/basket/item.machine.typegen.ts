// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.item.configuring.attributes.required:invocation[0]": {
      type: "done.invoke.item.configuring.attributes.required:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.item.configuring.options.required:invocation[0]": {
      type: "done.invoke.item.configuring.options.required:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.item.configuring.provisioning.checking:invocation[0]": {
      type: "done.invoke.item.configuring.provisioning.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.item.configuring.provisioning.required:invocation[0]": {
      type: "done.invoke.item.configuring.provisioning.required:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.item.configuring.term.required:invocation[0]": {
      type: "done.invoke.item.configuring.term.required:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.item.updating:invocation[0]": {
      type: "done.invoke.item.updating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.load": {
      type: "done.invoke.load";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.process": {
      type: "done.invoke.process";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.item.configuring.attributes.checking:invocation[0]": {
      type: "error.platform.item.configuring.attributes.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.item.configuring.attributes.required:invocation[0]": {
      type: "error.platform.item.configuring.attributes.required:invocation[0]";
      data: unknown;
    };
    "error.platform.item.configuring.options.checking:invocation[0]": {
      type: "error.platform.item.configuring.options.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.item.configuring.options.required:invocation[0]": {
      type: "error.platform.item.configuring.options.required:invocation[0]";
      data: unknown;
    };
    "error.platform.item.configuring.provisioning.checking:invocation[0]": {
      type: "error.platform.item.configuring.provisioning.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.item.configuring.provisioning.required:invocation[0]": {
      type: "error.platform.item.configuring.provisioning.required:invocation[0]";
      data: unknown;
    };
    "error.platform.item.configuring.term.checking:invocation[0]": {
      type: "error.platform.item.configuring.term.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.item.configuring.term.required:invocation[0]": {
      type: "error.platform.item.configuring.term.required:invocation[0]";
      data: unknown;
    };
    "error.platform.item.updating:invocation[0]": {
      type: "error.platform.item.updating:invocation[0]";
      data: unknown;
    };
    "error.platform.load": { type: "error.platform.load"; data: unknown };
    "error.platform.process": { type: "error.platform.process"; data: unknown };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    add: "done.invoke.process";
    checkAttributes: "done.invoke.item.configuring.attributes.checking:invocation[0]";
    checkOptions: "done.invoke.item.configuring.options.checking:invocation[0]";
    checkProvisioning: "done.invoke.item.configuring.provisioning.checking:invocation[0]";
    checkTerm: "done.invoke.item.configuring.term.checking:invocation[0]";
    configureTerm:
      | "done.invoke.item.configuring.attributes.required:invocation[0]"
      | "done.invoke.item.configuring.options.required:invocation[0]"
      | "done.invoke.item.configuring.provisioning.required:invocation[0]"
      | "done.invoke.item.configuring.term.required:invocation[0]";
    load: "done.invoke.load";
    update: "done.invoke.item.updating:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services:
      | "add"
      | "checkAttributes"
      | "checkOptions"
      | "checkProvisioning"
      | "checkTerm"
      | "configureTerm"
      | "load"
      | "update";
  };
  eventsCausingActions: {
    clearConfigurationFields:
      | "done.invoke.item.configuring.attributes.required:invocation[0]"
      | "done.invoke.item.configuring.options.required:invocation[0]"
      | "done.invoke.item.configuring.provisioning.checking:invocation[0]"
      | "done.invoke.item.configuring.provisioning.required:invocation[0]"
      | "done.invoke.item.configuring.term.required:invocation[0]";
    clearError: "UPDATE";
    clearModel: "done.invoke.item.updating:invocation[0]";
    setConfigurationFields: "error.platform.item.configuring.provisioning.checking:invocation[0]";
    setError:
      | "done.invoke.load"
      | "error.platform.item.configuring.attributes.required:invocation[0]"
      | "error.platform.item.configuring.options.required:invocation[0]"
      | "error.platform.item.configuring.provisioning.required:invocation[0]"
      | "error.platform.item.configuring.term.required:invocation[0]"
      | "error.platform.item.updating:invocation[0]"
      | "error.platform.process";
    setModel: "UPDATE" | "done.invoke.load";
    setProduct: "done.invoke.load";
    setResponse: "done.invoke.item.updating:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {
    add: "done.state.item.configuring";
    checkAttributes:
      | "done.invoke.item.updating:invocation[0]"
      | "done.invoke.load";
    checkOptions:
      | "done.invoke.item.updating:invocation[0]"
      | "done.invoke.load";
    checkProvisioning:
      | "done.invoke.item.updating:invocation[0]"
      | "done.invoke.load";
    checkTerm: "done.invoke.item.updating:invocation[0]" | "done.invoke.load";
    configureTerm:
      | "error.platform.item.configuring.attributes.checking:invocation[0]"
      | "error.platform.item.configuring.options.checking:invocation[0]"
      | "error.platform.item.configuring.provisioning.checking:invocation[0]"
      | "error.platform.item.configuring.term.checking:invocation[0]";
    load: "xstate.init";
    update: "UPDATE";
  };
  matchesStates:
    | "adding"
    | "complete"
    | "configuring"
    | "configuring.attributes"
    | "configuring.attributes.checking"
    | "configuring.attributes.complete"
    | "configuring.attributes.error"
    | "configuring.attributes.required"
    | "configuring.options"
    | "configuring.options.checking"
    | "configuring.options.complete"
    | "configuring.options.error"
    | "configuring.options.required"
    | "configuring.provisioning"
    | "configuring.provisioning.checking"
    | "configuring.provisioning.complete"
    | "configuring.provisioning.error"
    | "configuring.provisioning.required"
    | "configuring.term"
    | "configuring.term.checking"
    | "configuring.term.complete"
    | "configuring.term.error"
    | "configuring.term.required"
    | "error"
    | "loading"
    | "updating"
    | {
        configuring?:
          | "attributes"
          | "options"
          | "provisioning"
          | "term"
          | {
              attributes?: "checking" | "complete" | "error" | "required";
              options?: "checking" | "complete" | "error" | "required";
              provisioning?: "checking" | "complete" | "error" | "required";
              term?: "checking" | "complete" | "error" | "required";
            };
      };
  tags: never;
}
