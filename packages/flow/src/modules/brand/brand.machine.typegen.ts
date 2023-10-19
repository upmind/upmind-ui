// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.brandManager.billingCycles.loading:invocation[0]": {
      type: "done.invoke.brandManager.billingCycles.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.brandManager.config.loading:invocation[0]": {
      type: "done.invoke.brandManager.config.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.brandManager.currencies.loading:invocation[0]": {
      type: "done.invoke.brandManager.currencies.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.brandManager.modules.loading:invocation[0]": {
      type: "done.invoke.brandManager.modules.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.brandManager.organisation.loading:invocation[0]": {
      type: "done.invoke.brandManager.organisation.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.brandManager.settings.loading:invocation[0]": {
      type: "done.invoke.brandManager.settings.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    fetchBillingCycles: "done.invoke.brandManager.billingCycles.loading:invocation[0]";
    fetchBrandConfig: "done.invoke.brandManager.config.loading:invocation[0]";
    fetchBrandSettings: "done.invoke.brandManager.settings.loading:invocation[0]";
    fetchCurrencies: "done.invoke.brandManager.currencies.loading:invocation[0]";
    fetchModules: "done.invoke.brandManager.modules.loading:invocation[0]";
    fetchOrganisationConfig: "done.invoke.brandManager.organisation.loading:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services:
      | "fetchBillingCycles"
      | "fetchBrandConfig"
      | "fetchBrandSettings"
      | "fetchCurrencies"
      | "fetchModules"
      | "fetchOrganisationConfig";
  };
  eventsCausingActions: {
    setBillingCycles: "done.invoke.brandManager.billingCycles.loading:invocation[0]";
    setConfig: "done.invoke.brandManager.config.loading:invocation[0]";
    setConfigKeys: "CONFIG.GET";
    setCurrencies: "done.invoke.brandManager.currencies.loading:invocation[0]";
    setModules: "done.invoke.brandManager.modules.loading:invocation[0]";
    setOrganisation: "done.invoke.brandManager.organisation.loading:invocation[0]";
    setSettings: "done.invoke.brandManager.settings.loading:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {
    fetchBillingCycles: "RETRY" | "xstate.init";
    fetchBrandConfig: "CONFIG.GET" | "RETRY" | "xstate.init";
    fetchBrandSettings: "RETRY" | "xstate.init";
    fetchCurrencies: "RETRY" | "xstate.init";
    fetchModules: "RETRY" | "xstate.init";
    fetchOrganisationConfig: "RETRY" | "xstate.init";
  };
  matchesStates:
    | "billingCycles"
    | "billingCycles.complete"
    | "billingCycles.error"
    | "billingCycles.loading"
    | "config"
    | "config.complete"
    | "config.error"
    | "config.loading"
    | "currencies"
    | "currencies.complete"
    | "currencies.error"
    | "currencies.loading"
    | "modules"
    | "modules.complete"
    | "modules.error"
    | "modules.loading"
    | "organisation"
    | "organisation.complete"
    | "organisation.error"
    | "organisation.loading"
    | "settings"
    | "settings.complete"
    | "settings.error"
    | "settings.loading"
    | {
        billingCycles?: "complete" | "error" | "loading";
        config?: "complete" | "error" | "loading";
        currencies?: "complete" | "error" | "loading";
        modules?: "complete" | "error" | "loading";
        organisation?: "complete" | "error" | "loading";
        settings?: "complete" | "error" | "loading";
      };
  tags: never;
}
