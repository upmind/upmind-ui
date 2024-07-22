// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.recaptchaTokenManager.loading:invocation[0]": {
      type: "done.invoke.recaptchaTokenManager.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.recaptchaTokenManager.loading:invocation[0]": {
      type: "error.platform.recaptchaTokenManager.loading:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    load: "done.invoke.recaptchaTokenManager.loading:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "load";
  };
  eventsCausingActions: {
    setError: "error.platform.recaptchaTokenManager.loading:invocation[0]";
    setGrecaptcha: "done.invoke.recaptchaTokenManager.loading:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {};
  eventsCausingServices: {
    load: "xstate.init";
  };
  matchesStates: "available" | "complete" | "loading" | "unavailable";
  tags: never;
}
