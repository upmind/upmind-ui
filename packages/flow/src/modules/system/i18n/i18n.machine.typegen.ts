// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.i18nManager.loading:invocation[0]": {
      type: "done.invoke.i18nManager.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.i18nManager.loading:invocation[0]": {
      type: "error.platform.i18nManager.loading:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#i18nManager.processed": {
      type: "xstate.after(wait)#i18nManager.processed";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    fetchLocale: "done.invoke.i18nManager.loading:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "fetchLocale";
  };
  eventsCausingActions: {
    setError: "error.platform.i18nManager.loading:invocation[0]";
    setLocale: "done.invoke.i18nManager.loading:invocation[0]";
    switchLocale: "SWITCH";
  };
  eventsCausingDelays: {
    wait: "done.invoke.i18nManager.loading:invocation[0]";
  };
  eventsCausingGuards: {
    allLocalesLoaded: "xstate.after(wait)#i18nManager.processed";
  };
  eventsCausingServices: {
    fetchLocale: "GET" | "RETRY";
  };
  matchesStates: "complete" | "error" | "idle" | "loading" | "processed";
  tags: never;
}
