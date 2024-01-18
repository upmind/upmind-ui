// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.systemManager.billingCycles.loading:invocation[0]": {
      type: "done.invoke.systemManager.billingCycles.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.systemManager.countries.loading:invocation[0]": {
      type: "done.invoke.systemManager.countries.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.systemManager.currencies.loading:invocation[0]": {
      type: "done.invoke.systemManager.currencies.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.systemManager.departments.loading:invocation[0]": {
      type: "done.invoke.systemManager.departments.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.systemManager.languages.loading:invocation[0]": {
      type: "done.invoke.systemManager.languages.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.systemManager.regions.loading:invocation[0]": {
      type: "done.invoke.systemManager.regions.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.systemManager.statuses.loading:invocation[0]": {
      type: "done.invoke.systemManager.statuses.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    fetchBillingCycles: "done.invoke.systemManager.billingCycles.loading:invocation[0]";
    fetchCountries: "done.invoke.systemManager.countries.loading:invocation[0]";
    fetchCurrencies: "done.invoke.systemManager.currencies.loading:invocation[0]";
    fetchDepartments: "done.invoke.systemManager.departments.loading:invocation[0]";
    fetchLanguages: "done.invoke.systemManager.languages.loading:invocation[0]";
    fetchRegions: "done.invoke.systemManager.regions.loading:invocation[0]";
    fetchStatuses: "done.invoke.systemManager.statuses.loading:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services:
      | "fetchBillingCycles"
      | "fetchCountries"
      | "fetchCurrencies"
      | "fetchDepartments"
      | "fetchLanguages"
      | "fetchRegions"
      | "fetchStatuses";
  };
  eventsCausingActions: {
    setBillingCycles: "done.invoke.systemManager.billingCycles.loading:invocation[0]";
    setCountries: "done.invoke.systemManager.countries.loading:invocation[0]";
    setCurrencies: "done.invoke.systemManager.currencies.loading:invocation[0]";
    setDepartments: "done.invoke.systemManager.departments.loading:invocation[0]";
    setLanguages: "done.invoke.systemManager.languages.loading:invocation[0]";
    setRegions: "done.invoke.systemManager.regions.loading:invocation[0]";
    setStatuses: "done.invoke.systemManager.statuses.loading:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    allRegionsLoaded: "done.invoke.systemManager.regions.loading:invocation[0]";
  };
  eventsCausingServices: {
    fetchBillingCycles: "RETRY" | "xstate.init";
    fetchCountries: "COUNTRIES.GET" | "RETRY";
    fetchCurrencies: "RETRY" | "xstate.init";
    fetchDepartments: "DEPARTMENTS.GET" | "RETRY";
    fetchLanguages: "LANGUAGES.GET" | "RETRY";
    fetchRegions: "REGIONS.GET" | "RETRY";
    fetchStatuses: "RETRY" | "STATUSES.GET";
  };
  matchesStates:
    | "billingCycles"
    | "billingCycles.complete"
    | "billingCycles.error"
    | "billingCycles.loading"
    | "countries"
    | "countries.complete"
    | "countries.error"
    | "countries.idle"
    | "countries.loading"
    | "currencies"
    | "currencies.complete"
    | "currencies.error"
    | "currencies.loading"
    | "departments"
    | "departments.complete"
    | "departments.error"
    | "departments.idle"
    | "departments.loading"
    | "languages"
    | "languages.complete"
    | "languages.error"
    | "languages.idle"
    | "languages.loading"
    | "regions"
    | "regions.complete"
    | "regions.error"
    | "regions.idle"
    | "regions.loading"
    | "statuses"
    | "statuses.complete"
    | "statuses.error"
    | "statuses.idle"
    | "statuses.loading"
    | {
        billingCycles?: "complete" | "error" | "loading";
        countries?: "complete" | "error" | "idle" | "loading";
        currencies?: "complete" | "error" | "loading";
        departments?: "complete" | "error" | "idle" | "loading";
        languages?: "complete" | "error" | "idle" | "loading";
        regions?: "complete" | "error" | "idle" | "loading";
        statuses?: "complete" | "error" | "idle" | "loading";
      };
  tags: never;
}
