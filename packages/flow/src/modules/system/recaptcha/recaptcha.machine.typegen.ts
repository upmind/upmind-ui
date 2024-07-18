// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.process": {
      type: "done.invoke.process";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.recaptchaTokenManager.loading:invocation[0]": {
      type: "done.invoke.recaptchaTokenManager.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.process": { type: "error.platform.process"; data: unknown };
    "error.platform.recaptchaTokenManager.loading:invocation[0]": {
      type: "error.platform.recaptchaTokenManager.loading:invocation[0]";
      data: unknown;
    };
    "xstate.after(expires)#complete": {
      type: "xstate.after(expires)#complete";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    generate: "done.invoke.process";
    load: "done.invoke.recaptchaTokenManager.loading:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "generate" | "load";
  };
  eventsCausingActions: {
    clearToken: "CLEAR" | "xstate.after(expires)#complete";
    setError:
      | "error.platform.process"
      | "error.platform.recaptchaTokenManager.loading:invocation[0]";
    setGrecaptcha: "done.invoke.recaptchaTokenManager.loading:invocation[0]";
    setToken: "done.invoke.process";
  };
  eventsCausingDelays: {
    expires: "done.invoke.process";
  };
  eventsCausingGuards: {};
  eventsCausingServices: {
    generate: "GENERATE";
    load: "xstate.init";
  };
  matchesStates:
    | "available"
    | "complete"
    | "loading"
    | "processing"
    | "unavailable";
  tags: never;
}
