// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.brandManager.processing.config:invocation[0]": {
      type: "done.invoke.brandManager.processing.config:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.brandManager.processing.currencies:invocation[0]": {
      type: "done.invoke.brandManager.processing.currencies:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.brandManager.processing.modules:invocation[0]": {
      type: "done.invoke.brandManager.processing.modules:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.brandManager.processing.organisation:invocation[0]": {
      type: "done.invoke.brandManager.processing.organisation:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.brandManager.processing.settings:invocation[0]": {
      type: "done.invoke.brandManager.processing.settings:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.brandManager.processing.config:invocation[0]": {
      type: "error.platform.brandManager.processing.config:invocation[0]";
      data: unknown;
    };
    "error.platform.brandManager.processing.currencies:invocation[0]": {
      type: "error.platform.brandManager.processing.currencies:invocation[0]";
      data: unknown;
    };
    "error.platform.brandManager.processing.modules:invocation[0]": {
      type: "error.platform.brandManager.processing.modules:invocation[0]";
      data: unknown;
    };
    "error.platform.brandManager.processing.organisation:invocation[0]": {
      type: "error.platform.brandManager.processing.organisation:invocation[0]";
      data: unknown;
    };
    "error.platform.brandManager.processing.settings:invocation[0]": {
      type: "error.platform.brandManager.processing.settings:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    fetchBrandConfig: "done.invoke.brandManager.processing.config:invocation[0]";
    fetchBrandSettings: "done.invoke.brandManager.processing.settings:invocation[0]";
    fetchCurrencies: "done.invoke.brandManager.processing.currencies:invocation[0]";
    fetchModules: "done.invoke.brandManager.processing.modules:invocation[0]";
    fetchOrganisationConfig: "done.invoke.brandManager.processing.organisation:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services:
      | "fetchBrandConfig"
      | "fetchBrandSettings"
      | "fetchCurrencies"
      | "fetchModules"
      | "fetchOrganisationConfig";
  };
  eventsCausingActions: {
    clearError: "RETRY";
    setConfig: "done.invoke.brandManager.processing.config:invocation[0]";
    setCurrencies: "done.invoke.brandManager.processing.currencies:invocation[0]";
    setError:
      | "error.platform.brandManager.processing.config:invocation[0]"
      | "error.platform.brandManager.processing.currencies:invocation[0]"
      | "error.platform.brandManager.processing.modules:invocation[0]"
      | "error.platform.brandManager.processing.organisation:invocation[0]"
      | "error.platform.brandManager.processing.settings:invocation[0]";
    setModules: "done.invoke.brandManager.processing.modules:invocation[0]";
    setOrganisation: "done.invoke.brandManager.processing.organisation:invocation[0]";
    setSettings: "done.invoke.brandManager.processing.settings:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {
    fetchBrandConfig: "done.invoke.brandManager.processing.settings:invocation[0]";
    fetchBrandSettings: "done.invoke.brandManager.processing.organisation:invocation[0]";
    fetchCurrencies: "done.invoke.brandManager.processing.modules:invocation[0]";
    fetchModules: "done.invoke.brandManager.processing.config:invocation[0]";
    fetchOrganisationConfig: "RETRY" | "xstate.init";
  };
  matchesStates:
    | "available"
    | "error"
    | "processing"
    | "processing.config"
    | "processing.currencies"
    | "processing.modules"
    | "processing.organisation"
    | "processing.settings"
    | {
        processing?:
          | "config"
          | "currencies"
          | "modules"
          | "organisation"
          | "settings";
      };
  tags: never;
}
