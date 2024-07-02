// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.sessionGuest.login.authenticating:invocation[0]": {
      type: "done.invoke.sessionGuest.login.authenticating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.sessionGuest.register.checking:invocation[0]": {
      type: "done.invoke.sessionGuest.register.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.sessionGuest.register.loading:invocation[0]": {
      type: "done.invoke.sessionGuest.register.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.sessionGuest.register.registering:invocation[0]": {
      type: "done.invoke.sessionGuest.register.registering:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.sessionGuest.register.verifying:invocation[0]": {
      type: "done.invoke.sessionGuest.register.verifying:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.loading:invocation[0]": {
      type: "error.platform.loading:invocation[0]";
      data: unknown;
    };
    "error.platform.sessionGuest.login.authenticating:invocation[0]": {
      type: "error.platform.sessionGuest.login.authenticating:invocation[0]";
      data: unknown;
    };
    "error.platform.sessionGuest.login.verifying:invocation[0]": {
      type: "error.platform.sessionGuest.login.verifying:invocation[0]";
      data: unknown;
    };
    "error.platform.sessionGuest.register.authenticating:invocation[0]": {
      type: "error.platform.sessionGuest.register.authenticating:invocation[0]";
      data: unknown;
    };
    "error.platform.sessionGuest.register.checking:invocation[0]": {
      type: "error.platform.sessionGuest.register.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.sessionGuest.register.loading:invocation[0]": {
      type: "error.platform.sessionGuest.register.loading:invocation[0]";
      data: unknown;
    };
    "error.platform.sessionGuest.register.registering:invocation[0]": {
      type: "error.platform.sessionGuest.register.registering:invocation[0]";
      data: unknown;
    };
    "error.platform.sessionGuest.register.verifying:invocation[0]": {
      type: "error.platform.sessionGuest.register.verifying:invocation[0]";
      data: unknown;
    };
    "error.platform.unauthenticated:invocation[0]": {
      type: "error.platform.unauthenticated:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    authenticate:
      | "done.invoke.sessionGuest.login.authenticating:invocation[0]"
      | "done.invoke.sessionGuest.register.authenticating:invocation[0]";
    check: "done.invoke.loading:invocation[0]";
    checkForReCaptcha: "done.invoke.sessionGuest.register.checking:invocation[0]";
    generateToken: "done.invoke.unauthenticated:invocation[0]";
    getCustomFields: "done.invoke.sessionGuest.register.loading:invocation[0]";
    register: "done.invoke.sessionGuest.register.registering:invocation[0]";
    verify2fa: "done.invoke.sessionGuest.login.verifying:invocation[0]";
    verifyReCaptcha: "done.invoke.sessionGuest.register.verifying:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services:
      | "authenticate"
      | "check"
      | "checkForReCaptcha"
      | "generateToken"
      | "getCustomFields"
      | "register"
      | "verify2fa"
      | "verifyReCaptcha";
  };
  eventsCausingActions: {
    clear: "error.platform.loading:invocation[0]";
    clearError: "" | "xstate.init";
    escalateError:
      | "error.platform.sessionGuest.login.authenticating:invocation[0]"
      | "error.platform.sessionGuest.login.verifying:invocation[0]"
      | "error.platform.sessionGuest.register.authenticating:invocation[0]"
      | "error.platform.sessionGuest.register.checking:invocation[0]"
      | "error.platform.sessionGuest.register.loading:invocation[0]"
      | "error.platform.sessionGuest.register.registering:invocation[0]"
      | "error.platform.sessionGuest.register.verifying:invocation[0]"
      | "error.platform.unauthenticated:invocation[0]";
    set2faSchemas: "done.invoke.sessionGuest.login.authenticating:invocation[0]";
    set2faToken: "done.invoke.sessionGuest.login.authenticating:invocation[0]";
    setCustomFields: "done.invoke.sessionGuest.register.loading:invocation[0]";
    setError:
      | "error.platform.sessionGuest.login.authenticating:invocation[0]"
      | "error.platform.sessionGuest.login.verifying:invocation[0]"
      | "error.platform.sessionGuest.register.authenticating:invocation[0]"
      | "error.platform.sessionGuest.register.checking:invocation[0]"
      | "error.platform.sessionGuest.register.loading:invocation[0]"
      | "error.platform.sessionGuest.register.registering:invocation[0]"
      | "error.platform.sessionGuest.register.verifying:invocation[0]"
      | "error.platform.unauthenticated:invocation[0]";
    setLoginSchemas: "";
    setModel: "AUTHENTICATE" | "REGISTER";
    setRegisterSchemas: "done.invoke.sessionGuest.register.loading:invocation[0]";
    trackLogin: "done.invoke.sessionGuest.login.authenticating:invocation[0]";
    trackRegister: "done.invoke.sessionGuest.register.registering:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    requires2fa: "done.invoke.sessionGuest.login.authenticating:invocation[0]";
    requiresReCaptcha: "done.invoke.sessionGuest.register.checking:invocation[0]";
  };
  eventsCausingServices: {
    authenticate:
      | "AUTHENTICATE"
      | "done.invoke.sessionGuest.register.registering:invocation[0]";
    check: "xstate.init";
    checkForReCaptcha: "REGISTER";
    generateToken: "error.platform.loading:invocation[0]";
    getCustomFields: "REGISTER";
    register:
      | "done.invoke.sessionGuest.register.checking:invocation[0]"
      | "done.invoke.sessionGuest.register.verifying:invocation[0]";
    verify2fa: "VERIFY";
    verifyReCaptcha: "VERIFY";
  };
  matchesStates:
    | "complete"
    | "error"
    | "idle"
    | "loading"
    | "login"
    | "login.authenticating"
    | "login.available"
    | "login.challenging"
    | "login.loading"
    | "login.verifying"
    | "register"
    | "register.authenticating"
    | "register.available"
    | "register.challenging"
    | "register.checking"
    | "register.loading"
    | "register.registering"
    | "register.verifying"
    | "unauthenticated"
    | {
        login?:
          | "authenticating"
          | "available"
          | "challenging"
          | "loading"
          | "verifying";
        register?:
          | "authenticating"
          | "available"
          | "challenging"
          | "checking"
          | "loading"
          | "registering"
          | "verifying";
      };
  tags: never;
}
