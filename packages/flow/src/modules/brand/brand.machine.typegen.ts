// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.brandManager.processing.config.fetching:invocation[0]": {
      type: "done.invoke.brandManager.processing.config.fetching:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.brandManager.processing.currencies.fetching:invocation[0]": {
      type: "done.invoke.brandManager.processing.currencies.fetching:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.brandManager.processing.modules.fetching:invocation[0]": {
      type: "done.invoke.brandManager.processing.modules.fetching:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.brandManager.processing.organisation.fetching:invocation[0]": {
      type: "done.invoke.brandManager.processing.organisation.fetching:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.brandManager.processing.settings.fetching:invocation[0]": {
      type: "done.invoke.brandManager.processing.settings.fetching:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    fetchBrandConfig: "done.invoke.brandManager.processing.config.fetching:invocation[0]";
    fetchBrandSettings: "done.invoke.brandManager.processing.settings.fetching:invocation[0]";
    fetchCurrencies: "done.invoke.brandManager.processing.currencies.fetching:invocation[0]";
    fetchModules: "done.invoke.brandManager.processing.modules.fetching:invocation[0]";
    fetchOrganisationConfig: "done.invoke.brandManager.processing.organisation.fetching:invocation[0]";
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
    setConfig: "done.invoke.brandManager.processing.config.fetching:invocation[0]";
    setCurrencies: "done.invoke.brandManager.processing.currencies.fetching:invocation[0]";
    setModules: "done.invoke.brandManager.processing.modules.fetching:invocation[0]";
    setOrganisation: "done.invoke.brandManager.processing.organisation.fetching:invocation[0]";
    setSettings: "done.invoke.brandManager.processing.settings.fetching:invocation[0]";
  };
  eventsCausingDelays: {
    wait: "done.state.processing";
  };
  eventsCausingGuards: {};
  eventsCausingServices: {
    fetchBrandConfig: "RETRY" | "xstate.init";
    fetchBrandSettings: "RETRY" | "xstate.init";
    fetchCurrencies: "RETRY" | "xstate.init";
    fetchModules: "RETRY" | "xstate.init";
    fetchOrganisationConfig: "RETRY" | "xstate.init";
  };
  matchesStates:
    | "complete"
    | "processed"
    | "processing"
    | "processing.config"
    | "processing.config.error"
    | "processing.config.fetching"
    | "processing.config.success"
    | "processing.currencies"
    | "processing.currencies.error"
    | "processing.currencies.fetching"
    | "processing.currencies.success"
    | "processing.modules"
    | "processing.modules.error"
    | "processing.modules.fetching"
    | "processing.modules.success"
    | "processing.organisation"
    | "processing.organisation.error"
    | "processing.organisation.fetching"
    | "processing.organisation.success"
    | "processing.settings"
    | "processing.settings.error"
    | "processing.settings.fetching"
    | "processing.settings.success"
    | {
        processing?:
          | "config"
          | "currencies"
          | "modules"
          | "organisation"
          | "settings"
          | {
              config?: "error" | "fetching" | "success";
              currencies?: "error" | "fetching" | "success";
              modules?: "error" | "fetching" | "success";
              organisation?: "error" | "fetching" | "success";
              settings?: "error" | "fetching" | "success";
            };
      };
  tags: never;
}
