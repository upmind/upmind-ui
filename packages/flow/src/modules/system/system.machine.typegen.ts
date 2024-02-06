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
    "xstate.after(wait)#systemManager.billingCycles.processed": {
      type: "xstate.after(wait)#systemManager.billingCycles.processed";
    };
    "xstate.after(wait)#systemManager.countries.processed": {
      type: "xstate.after(wait)#systemManager.countries.processed";
    };
    "xstate.after(wait)#systemManager.currencies.processed": {
      type: "xstate.after(wait)#systemManager.currencies.processed";
    };
    "xstate.after(wait)#systemManager.departments.processed": {
      type: "xstate.after(wait)#systemManager.departments.processed";
    };
    "xstate.after(wait)#systemManager.languages.processed": {
      type: "xstate.after(wait)#systemManager.languages.processed";
    };
    "xstate.after(wait)#systemManager.regions.processed": {
      type: "xstate.after(wait)#systemManager.regions.processed";
    };
    "xstate.after(wait)#systemManager.statuses.processed": {
      type: "xstate.after(wait)#systemManager.statuses.processed";
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
  eventsCausingDelays: {
    wait:
      | "done.invoke.systemManager.billingCycles.loading:invocation[0]"
      | "done.invoke.systemManager.countries.loading:invocation[0]"
      | "done.invoke.systemManager.currencies.loading:invocation[0]"
      | "done.invoke.systemManager.departments.loading:invocation[0]"
      | "done.invoke.systemManager.languages.loading:invocation[0]"
      | "done.invoke.systemManager.regions.loading:invocation[0]"
      | "done.invoke.systemManager.statuses.loading:invocation[0]";
  };
  eventsCausingGuards: {
    allRegionsLoaded: "xstate.after(wait)#systemManager.regions.processed";
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
    | "billingCycles.processed"
    | "countries"
    | "countries.complete"
    | "countries.error"
    | "countries.idle"
    | "countries.loading"
    | "countries.processed"
    | "currencies"
    | "currencies.complete"
    | "currencies.error"
    | "currencies.loading"
    | "currencies.processed"
    | "departments"
    | "departments.complete"
    | "departments.error"
    | "departments.idle"
    | "departments.loading"
    | "departments.processed"
    | "languages"
    | "languages.complete"
    | "languages.error"
    | "languages.idle"
    | "languages.loading"
    | "languages.processed"
    | "regions"
    | "regions.complete"
    | "regions.error"
    | "regions.idle"
    | "regions.loading"
    | "regions.processed"
    | "statuses"
    | "statuses.complete"
    | "statuses.error"
    | "statuses.idle"
    | "statuses.loading"
    | "statuses.processed"
    | {
        billingCycles?: "complete" | "error" | "loading" | "processed";
        countries?: "complete" | "error" | "idle" | "loading" | "processed";
        currencies?: "complete" | "error" | "loading" | "processed";
        departments?: "complete" | "error" | "idle" | "loading" | "processed";
        languages?: "complete" | "error" | "idle" | "loading" | "processed";
        regions?: "complete" | "error" | "idle" | "loading" | "processed";
        statuses?: "complete" | "error" | "idle" | "loading" | "processed";
      };
  tags: never;
}
