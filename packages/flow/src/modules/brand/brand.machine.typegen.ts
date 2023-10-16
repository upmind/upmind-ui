// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.brandManager.config.fetching:invocation[0]": {
      type: "done.invoke.brandManager.config.fetching:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.brandManager.currencies.fetching:invocation[0]": {
      type: "done.invoke.brandManager.currencies.fetching:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.brandManager.modules.fetching:invocation[0]": {
      type: "done.invoke.brandManager.modules.fetching:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.brandManager.organisation.fetching:invocation[0]": {
      type: "done.invoke.brandManager.organisation.fetching:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.brandManager.settings.fetching:invocation[0]": {
      type: "done.invoke.brandManager.settings.fetching:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    fetchBrandConfig: "done.invoke.brandManager.config.fetching:invocation[0]";
    fetchBrandSettings: "done.invoke.brandManager.settings.fetching:invocation[0]";
    fetchCurrencies: "done.invoke.brandManager.currencies.fetching:invocation[0]";
    fetchModules: "done.invoke.brandManager.modules.fetching:invocation[0]";
    fetchOrganisationConfig: "done.invoke.brandManager.organisation.fetching:invocation[0]";
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
    setConfig: "done.invoke.brandManager.config.fetching:invocation[0]";
    setConfigKeys: "CONFIG.GET";
    setCurrencies: "done.invoke.brandManager.currencies.fetching:invocation[0]";
    setModules: "done.invoke.brandManager.modules.fetching:invocation[0]";
    setOrganisation: "done.invoke.brandManager.organisation.fetching:invocation[0]";
    setSettings: "done.invoke.brandManager.settings.fetching:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {
    fetchBrandConfig: "CONFIG.GET" | "RETRY" | "xstate.init";
    fetchBrandSettings: "RETRY" | "xstate.init";
    fetchCurrencies: "RETRY" | "xstate.init";
    fetchModules: "RETRY" | "xstate.init";
    fetchOrganisationConfig: "RETRY" | "xstate.init";
  };
  matchesStates:
    | "config"
    | "config.complete"
    | "config.error"
    | "config.fetching"
    | "currencies"
    | "currencies.complete"
    | "currencies.error"
    | "currencies.fetching"
    | "modules"
    | "modules.complete"
    | "modules.error"
    | "modules.fetching"
    | "organisation"
    | "organisation.complete"
    | "organisation.error"
    | "organisation.fetching"
    | "settings"
    | "settings.complete"
    | "settings.error"
    | "settings.fetching"
    | {
        config?: "complete" | "error" | "fetching";
        currencies?: "complete" | "error" | "fetching";
        modules?: "complete" | "error" | "fetching";
        organisation?: "complete" | "error" | "fetching";
        settings?: "complete" | "error" | "fetching";
      };
  tags: never;
}
