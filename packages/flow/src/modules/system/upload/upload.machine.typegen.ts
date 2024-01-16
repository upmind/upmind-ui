// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "done.invoke.uploadManager.checking:invocation[0]": {
      type: "done.invoke.uploadManager.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.uploadManager.loading:invocation[0]": {
      type: "done.invoke.uploadManager.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.uploadManager.processing:invocation[0]": {
      type: "done.invoke.uploadManager.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.uploadManager.checking:invocation[0]": {
      type: "error.platform.uploadManager.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.uploadManager.loading:invocation[0]": {
      type: "error.platform.uploadManager.loading:invocation[0]";
      data: unknown;
    };
    "error.platform.uploadManager.processing:invocation[0]": {
      type: "error.platform.uploadManager.processing:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#uploadManager.processed": {
      type: "xstate.after(wait)#uploadManager.processed";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    check: "done.invoke.uploadManager.checking:invocation[0]";
    getImage: "done.invoke.uploadManager.loading:invocation[0]";
    upload: "done.invoke.uploadManager.processing:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "check" | "getImage" | "upload";
  };
  eventsCausingActions: {
    clear: "ADD" | "REMOVE";
    clearError:
      | "ADD"
      | "LOAD"
      | "RETRY"
      | "done.invoke.uploadManager.checking:invocation[0]";
    setError:
      | "error.platform.uploadManager.checking:invocation[0]"
      | "error.platform.uploadManager.loading:invocation[0]"
      | "error.platform.uploadManager.processing:invocation[0]";
    setProgress: "PROGRESS";
    setRequest: "done.invoke.uploadManager.checking:invocation[0]";
    setResponse:
      | "done.invoke.uploadManager.loading:invocation[0]"
      | "done.invoke.uploadManager.processing:invocation[0]";
  };
  eventsCausingDelays: {
    wait:
      | "done.invoke.uploadManager.loading:invocation[0]"
      | "done.invoke.uploadManager.processing:invocation[0]";
  };
  eventsCausingGuards: {};
  eventsCausingServices: {
    check: "ADD";
    getImage: "LOAD";
    upload: "RETRY" | "done.invoke.uploadManager.checking:invocation[0]";
  };
  matchesStates:
    | "checking"
    | "complete"
    | "error"
    | "idle"
    | "loading"
    | "processed"
    | "processing";
  tags: never;
}
