// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.brand.loading.config:invocation[0]": {
      type: "done.invoke.brand.loading.config:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.brand.loading.currencies:invocation[0]": {
      type: "done.invoke.brand.loading.currencies:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.brand.loading.modules:invocation[0]": {
      type: "done.invoke.brand.loading.modules:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.brand.loading.organisation:invocation[0]": {
      type: "done.invoke.brand.loading.organisation:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.brand.loading.settings:invocation[0]": {
      type: "done.invoke.brand.loading.settings:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.brand.loading.config:invocation[0]": {
      type: "error.platform.brand.loading.config:invocation[0]";
      data: unknown;
    };
    "error.platform.brand.loading.currencies:invocation[0]": {
      type: "error.platform.brand.loading.currencies:invocation[0]";
      data: unknown;
    };
    "error.platform.brand.loading.modules:invocation[0]": {
      type: "error.platform.brand.loading.modules:invocation[0]";
      data: unknown;
    };
    "error.platform.brand.loading.organisation:invocation[0]": {
      type: "error.platform.brand.loading.organisation:invocation[0]";
      data: unknown;
    };
    "error.platform.brand.loading.settings:invocation[0]": {
      type: "error.platform.brand.loading.settings:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    fetchConfig: "done.invoke.brand.loading.config:invocation[0]";
    fetchCurrencies: "done.invoke.brand.loading.currencies:invocation[0]";
    fetchModules: "done.invoke.brand.loading.modules:invocation[0]";
    fetchOrganisation: "done.invoke.brand.loading.organisation:invocation[0]";
    fetchSettings: "done.invoke.brand.loading.settings:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services:
      | "fetchConfig"
      | "fetchCurrencies"
      | "fetchModules"
      | "fetchOrganisation"
      | "fetchSettings";
  };
  eventsCausingActions: {
    clearError: "RETRY";
    setConfig: "done.invoke.brand.loading.config:invocation[0]";
    setCurrencies: "done.invoke.brand.loading.currencies:invocation[0]";
    setError:
      | "error.platform.brand.loading.config:invocation[0]"
      | "error.platform.brand.loading.currencies:invocation[0]"
      | "error.platform.brand.loading.modules:invocation[0]"
      | "error.platform.brand.loading.organisation:invocation[0]"
      | "error.platform.brand.loading.settings:invocation[0]";
    setModules: "done.invoke.brand.loading.modules:invocation[0]";
    setOrganisation: "done.invoke.brand.loading.organisation:invocation[0]";
    setSettings: "done.invoke.brand.loading.settings:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {
    fetchConfig: "done.invoke.brand.loading.settings:invocation[0]";
    fetchCurrencies: "done.invoke.brand.loading.modules:invocation[0]";
    fetchModules: "done.invoke.brand.loading.config:invocation[0]";
    fetchOrganisation: never;
    fetchSettings: "done.invoke.brand.loading.organisation:invocation[0]";
  };
  matchesStates:
    | "available"
    | "error"
    | "loading"
    | "loading.config"
    | "loading.currencies"
    | "loading.modules"
    | "loading.organisation"
    | "loading.settings"
    | {
        loading?:
          | "config"
          | "currencies"
          | "modules"
          | "organisation"
          | "settings";
      };
  tags: never;
}
