// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.clientItemManager.loading:invocation[0]": {
      type: "done.invoke.clientItemManager.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.clientItemManager.processing.adding:invocation[0]": {
      type: "done.invoke.clientItemManager.processing.adding:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.clientItemManager.processing.removing:invocation[0]": {
      type: "done.invoke.clientItemManager.processing.removing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.clientItemManager.processing.setting:invocation[0]": {
      type: "done.invoke.clientItemManager.processing.setting:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.clientItemManager.processing.updating:invocation[0]": {
      type: "done.invoke.clientItemManager.processing.updating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.checking:invocation[0]": {
      type: "error.platform.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.clientItemManager.loading:invocation[0]": {
      type: "error.platform.clientItemManager.loading:invocation[0]";
      data: unknown;
    };
    "error.platform.clientItemManager.processing.adding:invocation[0]": {
      type: "error.platform.clientItemManager.processing.adding:invocation[0]";
      data: unknown;
    };
    "error.platform.clientItemManager.processing.removing:invocation[0]": {
      type: "error.platform.clientItemManager.processing.removing:invocation[0]";
      data: unknown;
    };
    "error.platform.clientItemManager.processing.setting:invocation[0]": {
      type: "error.platform.clientItemManager.processing.setting:invocation[0]";
      data: unknown;
    };
    "error.platform.clientItemManager.processing.updating:invocation[0]": {
      type: "error.platform.clientItemManager.processing.updating:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    add: "done.invoke.clientItemManager.processing.adding:invocation[0]";
    loadLookups: "done.invoke.clientItemManager.loading:invocation[0]";
    remove: "done.invoke.clientItemManager.processing.removing:invocation[0]";
    setDefault: "done.invoke.clientItemManager.processing.setting:invocation[0]";
    update: "done.invoke.clientItemManager.processing.updating:invocation[0]";
    validate: "done.invoke.checking:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services:
      | "add"
      | "loadLookups"
      | "remove"
      | "setDefault"
      | "update"
      | "validate";
  };
  eventsCausingActions: {
    clearError:
      | "CLEAR"
      | "DEFAULT"
      | "REMOVE"
      | "RETRY"
      | "SET"
      | "UPDATE"
      | "done.invoke.clientItemManager.loading:invocation[0]"
      | "xstate.init";
    clearModel:
      | "CLEAR"
      | "done.invoke.clientItemManager.processing.removing:invocation[0]";
    setError:
      | "error.platform.checking:invocation[0]"
      | "error.platform.clientItemManager.loading:invocation[0]"
      | "error.platform.clientItemManager.processing.adding:invocation[0]"
      | "error.platform.clientItemManager.processing.removing:invocation[0]"
      | "error.platform.clientItemManager.processing.setting:invocation[0]"
      | "error.platform.clientItemManager.processing.updating:invocation[0]";
    setLookups: "done.invoke.clientItemManager.loading:invocation[0]";
    setModel:
      | "SET"
      | "done.invoke.clientItemManager.processing.adding:invocation[0]"
      | "done.invoke.clientItemManager.processing.setting:invocation[0]"
      | "done.invoke.clientItemManager.processing.updating:invocation[0]";
    setSchemas: "done.invoke.clientItemManager.loading:invocation[0]";
  };
  eventsCausingDelays: {
    wait:
      | "done.invoke.clientItemManager.processing.adding:invocation[0]"
      | "done.invoke.clientItemManager.processing.removing:invocation[0]"
      | "done.invoke.clientItemManager.processing.setting:invocation[0]"
      | "done.invoke.clientItemManager.processing.updating:invocation[0]";
  };
  eventsCausingGuards: {
    canRemove: "REMOVE";
    isNew: "UPDATE";
    isNotDefault: "DEFAULT";
  };
  eventsCausingServices: {
    add: "UPDATE";
    loadLookups: "CLEAR" | "DEFAULT" | "REMOVE" | "SET" | "xstate.init";
    remove: "REMOVE";
    setDefault: "DEFAULT";
    update: "UPDATE";
    validate:
      | "CLEAR"
      | "SET"
      | "done.invoke.clientItemManager.loading:invocation[0]";
  };
  matchesStates:
    | "checking"
    | "complete"
    | "error"
    | "invalid"
    | "loading"
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
