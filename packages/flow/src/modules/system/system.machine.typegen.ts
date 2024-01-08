// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.systemManager.billingCycles.loading:invocation[0]": {
      type: "done.invoke.systemManager.billingCycles.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.systemManager.currencies.loading:invocation[0]": {
      type: "done.invoke.systemManager.currencies.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    fetchBillingCycles: "done.invoke.systemManager.billingCycles.loading:invocation[0]";
    fetchCurrencies: "done.invoke.systemManager.currencies.loading:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "fetchBillingCycles" | "fetchCurrencies";
  };
  eventsCausingActions: {
    setBillingCycles: "done.invoke.systemManager.billingCycles.loading:invocation[0]";
    setCurrencies: "done.invoke.systemManager.currencies.loading:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {
    fetchBillingCycles: "RETRY" | "xstate.init";
    fetchCurrencies: "RETRY" | "xstate.init";
  };
  matchesStates:
    | "billingCycles"
    | "billingCycles.complete"
    | "billingCycles.error"
    | "billingCycles.loading"
    | "currencies"
    | "currencies.complete"
    | "currencies.error"
    | "currencies.loading"
    | {
        billingCycles?: "complete" | "error" | "loading";
        currencies?: "complete" | "error" | "loading";
      };
  tags: never;
}
