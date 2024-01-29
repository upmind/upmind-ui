// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.checking:invocation[0]": {
      type: "done.invoke.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.companyManager.processing.adding:invocation[0]": {
      type: "done.invoke.companyManager.processing.adding:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.companyManager.processing.removing:invocation[0]": {
      type: "done.invoke.companyManager.processing.removing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.companyManager.processing.setting:invocation[0]": {
      type: "done.invoke.companyManager.processing.setting:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.companyManager.processing.updating:invocation[0]": {
      type: "done.invoke.companyManager.processing.updating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.checking:invocation[0]": {
      type: "error.platform.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.companyManager.processing.adding:invocation[0]": {
      type: "error.platform.companyManager.processing.adding:invocation[0]";
      data: unknown;
    };
    "error.platform.companyManager.processing.removing:invocation[0]": {
      type: "error.platform.companyManager.processing.removing:invocation[0]";
      data: unknown;
    };
    "error.platform.companyManager.processing.setting:invocation[0]": {
      type: "error.platform.companyManager.processing.setting:invocation[0]";
      data: unknown;
    };
    "error.platform.companyManager.processing.updating:invocation[0]": {
      type: "error.platform.companyManager.processing.updating:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    add: "done.invoke.companyManager.processing.adding:invocation[0]";
    remove: "done.invoke.companyManager.processing.removing:invocation[0]";
    setDefault: "done.invoke.companyManager.processing.setting:invocation[0]";
    update: "done.invoke.companyManager.processing.updating:invocation[0]";
    validate: "done.invoke.checking:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "add" | "remove" | "setDefault" | "update" | "validate";
  };
  eventsCausingActions: {
    clearError:
      | "CLEAR"
      | "DEFAULT"
      | "REMOVE"
      | "RETRY"
      | "SET"
      | "UPDATE"
      | "xstate.init";
    clearModel:
      | "CLEAR"
      | "done.invoke.companyManager.processing.removing:invocation[0]";
    refresh: "done.invoke.checking:invocation[0]";
    setError:
      | "error.platform.checking:invocation[0]"
      | "error.platform.companyManager.processing.adding:invocation[0]"
      | "error.platform.companyManager.processing.removing:invocation[0]"
      | "error.platform.companyManager.processing.setting:invocation[0]"
      | "error.platform.companyManager.processing.updating:invocation[0]";
    setModel:
      | "SET"
      | "done.invoke.companyManager.processing.adding:invocation[0]"
      | "done.invoke.companyManager.processing.setting:invocation[0]"
      | "done.invoke.companyManager.processing.updating:invocation[0]";
    setSchemas: "CLEAR" | "DEFAULT" | "REMOVE" | "SET" | "xstate.init";
  };
  eventsCausingDelays: {
    wait:
      | "done.invoke.companyManager.processing.adding:invocation[0]"
      | "done.invoke.companyManager.processing.removing:invocation[0]"
      | "done.invoke.companyManager.processing.setting:invocation[0]"
      | "done.invoke.companyManager.processing.updating:invocation[0]";
  };
  eventsCausingGuards: {
    canRemove: "REMOVE";
    isNew: "UPDATE";
    isNotDefault: "DEFAULT";
  };
  eventsCausingServices: {
    add: "UPDATE";
    remove: "REMOVE";
    setDefault: "DEFAULT";
    update: "UPDATE";
    validate: "CLEAR" | "DEFAULT" | "REMOVE" | "SET" | "xstate.init";
  };
  matchesStates:
    | "checking"
    | "complete"
    | "error"
    | "invalid"
    | "processed"
    | "processing"
    | "processing.adding"
    | "processing.removing"
    | "processing.setting"
    | "processing.updating"
    | "valid"
    | { processing?: "adding" | "removing" | "setting" | "updating" };
  tags: never;
}
