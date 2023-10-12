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
    dumpBasket: "done.invoke.clearing:invocation[0]";
    isAuthenticated: "done.invoke.basketManager.idle.client.checking:invocation[0]";
    refreshToken: "done.invoke.basketManager.error.unauthorized:invocation[0]";
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
      | "dumpBasket"
      | "isAuthenticated"
      | "refreshToken";
  };
  eventsCausingActions: {
    addProduct: "PRODUCT.ADD";
    clearBasket: "done.invoke.clearing:invocation[0]";
    clearError: "error.platform.loading:invocation[0]";
    setBasket:
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.loading:invocation[0]";
    setError:
      | "error.platform.claiming:invocation[0]"
      | "error.platform.loading:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    hasItems: "";
    hasNoBasket: "PRODUCT.ADD";
    isUnauthorized: "error.platform.loading:invocation[0]";
  };
  eventsCausingServices: {
    authSubscription: "UNAUTHENTICATED" | "xstate.init";
    check:
      | "SESSION"
      | "done.invoke.basketManager.error.unauthorized:invocation[0]"
      | "done.invoke.clearing:invocation[0]";
    claim: "AUTHENTICATED";
    create: "GENERATE" | "PRODUCT.ADD";
    dumpBasket: "UNAUTHENTICATED";
    isAuthenticated:
      | "done.invoke.claiming:invocation[0]"
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.loading:invocation[0]";
    refreshToken: "error.platform.loading:invocation[0]";
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
    | "error.unauthorized"
    | "error.unknown"
    | "generating"
    | "idle"
    | "idle.client"
    | "idle.client.authenticated"
    | "idle.client.checking"
    | "idle.client.unauthenticated"
    | "idle.items"
    | "idle.items.empty"
    | "idle.items.invalid"
    | "idle.items.valid"
    | "loading"
    | "readyForCheckout"
    | "subscribing"
    | {
        checkout?: "additional" | "billing" | "payment" | "shipping";
        error?: "unauthorized" | "unknown";
        idle?:
          | "client"
          | "items"
          | {
              client?: "authenticated" | "checking" | "unauthenticated";
              items?: "empty" | "invalid" | "valid";
            };
      };
  tags: never;
}
