// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.brandManager.processing.config.loading:invocation[0]": {
      type: "done.invoke.brandManager.processing.config.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.brandManager.processing.modules.loading:invocation[0]": {
      type: "done.invoke.brandManager.processing.modules.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.brandManager.processing.organisation.loading:invocation[0]": {
      type: "done.invoke.brandManager.processing.organisation.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.brandManager.processing.settings.loading:invocation[0]": {
      type: "done.invoke.brandManager.processing.settings.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    fetchBrandConfig: "done.invoke.brandManager.processing.config.loading:invocation[0]";
    fetchBrandSettings: "done.invoke.brandManager.processing.settings.loading:invocation[0]";
    fetchModules: "done.invoke.brandManager.processing.modules.loading:invocation[0]";
    fetchOrganisationConfig: "done.invoke.brandManager.processing.organisation.loading:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services:
      | "fetchBrandConfig"
      | "fetchBrandSettings"
      | "fetchModules"
      | "fetchOrganisationConfig";
  };
  eventsCausingActions: {
    setConfig: "done.invoke.brandManager.processing.config.loading:invocation[0]";
    setConfigKeys: "CONFIG.GET";
    setModules: "done.invoke.brandManager.processing.modules.loading:invocation[0]";
    setOrganisation: "done.invoke.brandManager.processing.organisation.loading:invocation[0]";
    setSettings: "done.invoke.brandManager.processing.settings.loading:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {
    fetchBrandConfig: "CONFIG.GET" | "RETRY" | "xstate.init";
    fetchBrandSettings: "CONFIG.GET" | "RETRY" | "xstate.init";
    fetchModules: "CONFIG.GET" | "RETRY" | "xstate.init";
    fetchOrganisationConfig: "CONFIG.GET" | "RETRY" | "xstate.init";
  };
  matchesStates:
    | "complete"
    | "processing"
    | "processing.config"
    | "processing.config.complete"
    | "processing.config.error"
    | "processing.config.loading"
    | "processing.modules"
    | "processing.modules.complete"
    | "processing.modules.error"
    | "processing.modules.loading"
    | "processing.organisation"
    | "processing.organisation.complete"
    | "processing.organisation.error"
    | "processing.organisation.loading"
    | "processing.settings"
    | "processing.settings.complete"
    | "processing.settings.error"
    | "processing.settings.loading"
    | {
        processing?:
          | "config"
          | "modules"
          | "organisation"
          | "settings"
          | {
              config?: "complete" | "error" | "loading";
              modules?: "complete" | "error" | "loading";
              organisation?: "complete" | "error" | "loading";
              settings?: "complete" | "error" | "loading";
            };
      };
  tags: never;
}
