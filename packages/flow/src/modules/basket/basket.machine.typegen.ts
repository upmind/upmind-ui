// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.authCallback": {
      type: "done.invoke.authCallback";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.basketManager.error.unauthorized:invocation[0]": {
      type: "done.invoke.basketManager.error.unauthorized:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.generating:invocation[0]": {
      type: "done.invoke.generating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.loading:invocation[0]": {
      type: "done.invoke.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.updating:invocation[0]": {
      type: "done.invoke.updating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.authCallback": {
      type: "error.platform.authCallback";
      data: unknown;
    };
    "error.platform.generating:invocation[0]": {
      type: "error.platform.generating:invocation[0]";
      data: unknown;
    };
    "error.platform.loading:invocation[0]": {
      type: "error.platform.loading:invocation[0]";
      data: unknown;
    };
    "error.platform.updating:invocation[0]": {
      type: "error.platform.updating:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#basketManager.error.unknown": {
      type: "xstate.after(wait)#basketManager.error.unknown";
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    check: "done.invoke.loading:invocation[0]";
    checkAuth: "done.invoke.authCallback";
    create: "done.invoke.generating:invocation[0]";
    refreshToken: "done.invoke.basketManager.error.unauthorized:invocation[0]";
    update: "done.invoke.updating:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services: "check" | "checkAuth" | "create" | "refreshToken" | "update";
  };
  eventsCausingActions: {
    addProduct: "PRODUCT.ADD";
    clearError: "RETRY" | "error.platform.loading:invocation[0]";
    killSpawn: "KILL";
    setBasket:
      | "KILL"
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.loading:invocation[0]"
      | "done.invoke.updating:invocation[0]";
    setError: "error.platform.loading:invocation[0]";
  };
  eventsCausingDelays: {
    wait:
      | "error.platform.generating:invocation[0]"
      | "error.platform.loading:invocation[0]"
      | "error.platform.updating:invocation[0]";
  };
  eventsCausingGuards: {
    hasNoContent: "done.invoke.loading:invocation[0]";
    hasNoSpawned: "";
    isUnauthorized: "error.platform.loading:invocation[0]";
  };
  eventsCausingServices: {
    check:
      | "RETRY"
      | "done.invoke.basketManager.error.unauthorized:invocation[0]"
      | "xstate.init";
    checkAuth: never;
    create: "" | "PRODUCT.ADD";
    refreshToken: "error.platform.loading:invocation[0]";
    update: never;
  };
  matchesStates:
    | "checkout"
    | "checkout.additional"
    | "checkout.billing"
    | "checkout.payment"
    | "checkout.shipping"
    | "complete"
    | "confirm"
    | "error"
    | "error.unauthorized"
    | "error.unknown"
    | "idle"
    | "idle.items"
    | "idle.session"
    | "idle.session.auth"
    | "loading"
    | "processed"
    | "processed.available"
    | "processed.empty"
    | "processing"
    | "processing.generating"
    | "processing.spawning"
    | "processing.updating"
    | {
        checkout?: "additional" | "billing" | "payment" | "shipping";
        error?: "unauthorized" | "unknown";
        idle?: "items" | "session" | { session?: "auth" };
        processed?: "available" | "empty";
        processing?: "generating" | "spawning" | "updating";
      };
  tags: never;
}
