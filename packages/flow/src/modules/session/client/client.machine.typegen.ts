// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.client.authenticated.clearing:invocation[0]": {
      type: "done.invoke.client.authenticated.clearing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.client.authenticated.refreshing:invocation[0]": {
      type: "done.invoke.client.authenticated.refreshing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.client.unauthenticated.login.authenticating:invocation[0]": {
      type: "done.invoke.client.unauthenticated.login.authenticating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.client.unauthenticated.login.verifying:invocation[0]": {
      type: "done.invoke.client.unauthenticated.login.verifying:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.client.unauthenticated.register.authenticating:invocation[0]": {
      type: "done.invoke.client.unauthenticated.register.authenticating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.client.unauthenticated.register.checking:invocation[0]": {
      type: "done.invoke.client.unauthenticated.register.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.client.unauthenticated.register.loading:invocation[0]": {
      type: "done.invoke.client.unauthenticated.register.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.client.unauthenticated.register.registering:invocation[0]": {
      type: "done.invoke.client.unauthenticated.register.registering:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.client.unauthenticated.register.verifying:invocation[0]": {
      type: "done.invoke.client.unauthenticated.register.verifying:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.loading:invocation[0]": {
      type: "done.invoke.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.client.authenticated.refreshing:invocation[0]": {
      type: "error.platform.client.authenticated.refreshing:invocation[0]";
      data: unknown;
    };
    "error.platform.client.unauthenticated.login.authenticating:invocation[0]": {
      type: "error.platform.client.unauthenticated.login.authenticating:invocation[0]";
      data: unknown;
    };
    "error.platform.client.unauthenticated.login.verifying:invocation[0]": {
      type: "error.platform.client.unauthenticated.login.verifying:invocation[0]";
      data: unknown;
    };
    "error.platform.client.unauthenticated.register.authenticating:invocation[0]": {
      type: "error.platform.client.unauthenticated.register.authenticating:invocation[0]";
      data: unknown;
    };
    "error.platform.client.unauthenticated.register.checking:invocation[0]": {
      type: "error.platform.client.unauthenticated.register.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.client.unauthenticated.register.loading:invocation[0]": {
      type: "error.platform.client.unauthenticated.register.loading:invocation[0]";
      data: unknown;
    };
    "error.platform.client.unauthenticated.register.registering:invocation[0]": {
      type: "error.platform.client.unauthenticated.register.registering:invocation[0]";
      data: unknown;
    };
    "error.platform.client.unauthenticated.register.verifying:invocation[0]": {
      type: "error.platform.client.unauthenticated.register.verifying:invocation[0]";
      data: unknown;
    };
    "error.platform.loading:invocation[0]": {
      type: "error.platform.loading:invocation[0]";
      data: unknown;
    };
    "xstate.after(error)#client.unauthenticated.register.error": {
      type: "xstate.after(error)#client.unauthenticated.register.error";
    };
    "xstate.init": { type: "xstate.init" };
    "xstate.stop": { type: "xstate.stop" };
  };
  invokeSrcNameMap: {
    authenticate:
      | "done.invoke.client.unauthenticated.login.authenticating:invocation[0]"
      | "done.invoke.client.unauthenticated.register.authenticating:invocation[0]";
    check: "done.invoke.loading:invocation[0]";
    checkForReCaptcha: "done.invoke.client.unauthenticated.register.checking:invocation[0]";
    dumpToken: "done.invoke.client.authenticated.clearing:invocation[0]";
    getSchemas: "done.invoke.client.unauthenticated.register.loading:invocation[0]";
    persistToken: "done.invoke.client.authenticated.persisting:invocation[0]";
    refreshToken: "done.invoke.client.authenticated.refreshing:invocation[0]";
    register: "done.invoke.client.unauthenticated.register.registering:invocation[0]";
    verify2fa: "done.invoke.client.unauthenticated.login.verifying:invocation[0]";
    verifyReCaptcha: "done.invoke.client.unauthenticated.register.verifying:invocation[0]";
  };
  missingImplementations: {
    actions: "setChallengeToken";
    delays: never;
    guards: never;
    services:
      | "authenticate"
      | "check"
      | "checkForReCaptcha"
      | "dumpToken"
      | "getSchemas"
      | "persistToken"
      | "refreshToken"
      | "register"
      | "verify2fa"
      | "verifyReCaptcha";
  };
  eventsCausingActions: {
    clearError:
      | "done.invoke.client.authenticated.clearing:invocation[0]"
      | "xstate.init";
    clearToken:
      | "done.invoke.client.authenticated.clearing:invocation[0]"
      | "error.platform.loading:invocation[0]"
      | "xstate.stop";
    set2faToken: "done.invoke.client.unauthenticated.login.authenticating:invocation[0]";
    setChallengeToken:
      | "done.invoke.client.unauthenticated.login.verifying:invocation[0]"
      | "done.invoke.client.unauthenticated.register.verifying:invocation[0]";
    setError:
      | "error.platform.client.authenticated.refreshing:invocation[0]"
      | "error.platform.client.unauthenticated.login.authenticating:invocation[0]"
      | "error.platform.client.unauthenticated.login.verifying:invocation[0]"
      | "error.platform.client.unauthenticated.register.authenticating:invocation[0]"
      | "error.platform.client.unauthenticated.register.checking:invocation[0]"
      | "error.platform.client.unauthenticated.register.loading:invocation[0]"
      | "error.platform.client.unauthenticated.register.registering:invocation[0]"
      | "error.platform.client.unauthenticated.register.verifying:invocation[0]";
    setModel: "AUTHENTICATE" | "REGISTER";
    setSchemas: "done.invoke.client.unauthenticated.register.loading:invocation[0]";
    setToken:
      | "done.invoke.client.authenticated.refreshing:invocation[0]"
      | "done.invoke.client.unauthenticated.login.authenticating:invocation[0]"
      | "done.invoke.client.unauthenticated.register.authenticating:invocation[0]"
      | "done.invoke.client.unauthenticated.register.registering:invocation[0]"
      | "done.invoke.loading:invocation[0]";
  };
  eventsCausingDelays: {
    error:
      | "error.platform.client.unauthenticated.register.authenticating:invocation[0]"
      | "error.platform.client.unauthenticated.register.checking:invocation[0]"
      | "error.platform.client.unauthenticated.register.loading:invocation[0]"
      | "error.platform.client.unauthenticated.register.registering:invocation[0]";
  };
  eventsCausingGuards: {
    isRefreshing:
      | ""
      | "done.invoke.client.authenticated.clearing:invocation[0]";
    isUnauthorized: "error.platform.client.authenticated.refreshing:invocation[0]";
    requires2fa: "done.invoke.client.unauthenticated.login.authenticating:invocation[0]";
    requiresReCaptcha: "done.invoke.client.unauthenticated.register.checking:invocation[0]";
  };
  eventsCausingServices: {
    authenticate:
      | "AUTHENTICATE"
      | "done.invoke.client.unauthenticated.register.registering:invocation[0]";
    check:
      | "done.invoke.client.authenticated.clearing:invocation[0]"
      | "xstate.init";
    checkForReCaptcha: "REGISTER";
    dumpToken: "error.platform.client.authenticated.refreshing:invocation[0]";
    getSchemas: "REGISTER";
    persistToken:
      | ""
      | "done.invoke.client.authenticated.refreshing:invocation[0]";
    refreshToken: "";
    register:
      | "done.invoke.client.unauthenticated.register.checking:invocation[0]"
      | "done.invoke.client.unauthenticated.register.verifying:invocation[0]";
    verify2fa: "VERIFY";
    verifyReCaptcha: "VERIFY";
  };
  matchesStates:
    | "authenticated"
    | "authenticated.clearing"
    | "authenticated.idle"
    | "authenticated.persisting"
    | "authenticated.refreshing"
    | "complete"
    | "error"
    | "loading"
    | "unauthenticated"
    | "unauthenticated.idle"
    | "unauthenticated.login"
    | "unauthenticated.login.authenticating"
    | "unauthenticated.login.challenging"
    | "unauthenticated.login.idle"
    | "unauthenticated.login.verifying"
    | "unauthenticated.register"
    | "unauthenticated.register.authenticating"
    | "unauthenticated.register.challenging"
    | "unauthenticated.register.checking"
    | "unauthenticated.register.error"
    | "unauthenticated.register.idle"
    | "unauthenticated.register.loading"
    | "unauthenticated.register.registering"
    | "unauthenticated.register.verifying"
    | {
        authenticated?: "clearing" | "idle" | "persisting" | "refreshing";
        unauthenticated?:
          | "idle"
          | "login"
          | "register"
          | {
              login?: "authenticating" | "challenging" | "idle" | "verifying";
              register?:
                | "authenticating"
                | "challenging"
                | "checking"
                | "error"
                | "idle"
                | "loading"
                | "registering"
                | "verifying";
            };
      };
  tags: never;
}
