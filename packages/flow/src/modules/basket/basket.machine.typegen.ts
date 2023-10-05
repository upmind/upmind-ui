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
    "error.platform.loading:invocation[0]": {
      type: "error.platform.loading:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    authSubscription: "done.invoke.authCallback";
    check: "done.invoke.loading:invocation[0]";
    create: "done.invoke.generating:invocation[0]";
    refreshToken: "done.invoke.basketManager.error.unauthorized:invocation[0]";
    update: "done.invoke.updating:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: "wait";
    guards: never;
    services:
      | "authSubscription"
      | "check"
      | "create"
      | "refreshToken"
      | "update";
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
      | ""
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.updating:invocation[0]";
  };
  eventsCausingGuards: {
    hasItems: "";
    hasNoContent: "done.invoke.loading:invocation[0]";
    hasNoSpawned: "";
    isUnauthorized: "error.platform.loading:invocation[0]";
  };
  eventsCausingServices: {
    authSubscription:
      | "AUTHENTICATED"
      | "UNAUTHENTICATED"
      | "done.invoke.loading:invocation[0]"
      | "xstate.after(wait)#processed";
    check:
      | "RETRY"
      | "done.invoke.basketManager.error.unauthorized:invocation[0]"
      | "xstate.init";
    create: "PRODUCT.ADD" | "done.invoke.loading:invocation[0]";
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
    | "error"
    | "error.unauthorized"
    | "error.unknown"
    | "idle"
    | "idle.items"
    | "idle.items.empty"
    | "idle.items.invalid"
    | "idle.items.valid"
    | "idle.user"
    | "idle.user.invalid"
    | "idle.user.subscribing"
    | "idle.user.valid"
    | "loading"
    | "processed"
    | "processing"
    | "processing.generating"
    | "processing.spawning"
    | "processing.updating"
    | "readyForCheckout"
    | {
        checkout?: "additional" | "billing" | "payment" | "shipping";
        error?: "unauthorized" | "unknown";
        idle?:
          | "items"
          | "user"
          | {
              items?: "empty" | "invalid" | "valid";
              user?: "invalid" | "subscribing" | "valid";
            };
        processing?: "generating" | "spawning" | "updating";
      };
  tags: never;
}
