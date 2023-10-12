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
    "done.invoke.claiming:invocation[0]": {
      type: "done.invoke.claiming:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.clearing:invocation[0]": {
      type: "done.invoke.clearing:invocation[0]";
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
    "error.platform.authCallback": {
      type: "error.platform.authCallback";
      data: unknown;
    };
    "error.platform.claiming:invocation[0]": {
      type: "error.platform.claiming:invocation[0]";
      data: unknown;
    };
    "error.platform.items": { type: "error.platform.items"; data: unknown };
    "error.platform.loading:invocation[0]": {
      type: "error.platform.loading:invocation[0]";
      data: unknown;
    };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    authSubscription: "done.invoke.authCallback";
    check: "done.invoke.loading:invocation[0]";
    claim: "done.invoke.claiming:invocation[0]";
    create: "done.invoke.generating:invocation[0]";
    dump: "done.invoke.clearing:invocation[0]";
    isAuthenticated: "done.invoke.basketManager.idle.client.checking:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services:
      | "authSubscription"
      | "check"
      | "claim"
      | "create"
      | "dump"
      | "isAuthenticated";
  };
  eventsCausingActions: {
    addProduct: "PRODUCT.ADD";
    clearBasket: "done.invoke.clearing:invocation[0]";
    killSpawned: "KILL";
    setBasket:
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.loading:invocation[0]";
    setError:
      | "error.platform.claiming:invocation[0]"
      | "error.platform.items"
      | "error.platform.loading:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    hasItems: "";
    hasNoBasket: "PRODUCT.ADD";
    hasNoSpawned: "";
  };
  eventsCausingServices: {
    authSubscription: "UNAUTHENTICATED" | "xstate.init";
    check: "SESSION" | "done.invoke.clearing:invocation[0]";
    claim: "AUTHENTICATED";
    create: "GENERATE" | "PRODUCT.ADD";
    dump: "UNAUTHENTICATED";
    isAuthenticated:
      | "done.invoke.claiming:invocation[0]"
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.loading:invocation[0]";
    items: "";
  };
  matchesStates:
    | "checkout"
    | "checkout.additional"
    | "checkout.billing"
    | "checkout.payment"
    | "checkout.shipping"
    | "claiming"
    | "clearing"
    | "complete"
    | "error"
    | "generating"
    | "idle"
    | "idle.client"
    | "idle.client.authenticated"
    | "idle.client.checking"
    | "idle.client.unauthenticated"
    | "idle.items"
    | "idle.items.empty"
    | "idle.items.idle"
    | "idle.items.processed"
    | "idle.items.spawning"
    | "loading"
    | "readyForCheckout"
    | "subscribing"
    | {
        checkout?: "additional" | "billing" | "payment" | "shipping";
        idle?:
          | "client"
          | "items"
          | {
              client?: "authenticated" | "checking" | "unauthenticated";
              items?: "empty" | "idle" | "processed" | "spawning";
            };
      };
  tags: never;
}
