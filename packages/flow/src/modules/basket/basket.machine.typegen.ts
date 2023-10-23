// This file was automatically generated. Edits will be overwritten

export interface Typegen0 {
  "@@xstate/typegen": true;
  internalEvents: {
    "": { type: "" };
    "done.invoke.adding:invocation[0]": {
      type: "done.invoke.adding:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
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
    addToBasket: "done.invoke.adding:invocation[0]";
    authSubscription: "done.invoke.authCallback";
    check: "done.invoke.loading:invocation[0]";
    claim: "done.invoke.claiming:invocation[0]";
    generate: "done.invoke.generating:invocation[0]";
    isAuthenticated: "done.invoke.basketManager.shopping.client.checking:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services:
      | "addToBasket"
      | "authSubscription"
      | "check"
      | "claim"
      | "generate"
      | "isAuthenticated";
  };
  eventsCausingActions: {
    addItem: "ADD";
    clearBasket: "UNAUTHENTICATED";
    forwardTermUpdate: "UPDATE.TERM";
    removeItem: "done.invoke.adding:invocation[0]";
    setBasket:
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.loading:invocation[0]";
    setError:
      | "error.platform.claiming:invocation[0]"
      | "error.platform.loading:invocation[0]";
    setResponse: "done.invoke.adding:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    hasNewItems: "";
    hasNoBasket: "ADD";
    hasProducts: "";
    needsConfiguring: "";
  };
  eventsCausingServices: {
    addToBasket: "";
    authSubscription: "xstate.init";
    check: "SESSION" | "UNAUTHENTICATED";
    claim: "AUTHENTICATED";
    generate: "ADD";
    isAuthenticated:
      | "ADD"
      | "done.invoke.claiming:invocation[0]"
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.loading:invocation[0]";
  };
  matchesStates:
    | "checkout"
    | "checkout.additional"
    | "checkout.billing"
    | "checkout.payment"
    | "checkout.shipping"
    | "claiming"
    | "complete"
    | "error"
    | "generating"
    | "loading"
    | "shopping"
    | "shopping.client"
    | "shopping.client.authenticated"
    | "shopping.client.checking"
    | "shopping.client.unauthenticated"
    | "shopping.items"
    | "shopping.items.configuring"
    | "shopping.items.empty"
    | "shopping.products"
    | "shopping.products.added"
    | "shopping.products.adding"
    | "shopping.products.empty"
    | "subscribing"
    | {
        checkout?: "additional" | "billing" | "payment" | "shipping";
        shopping?:
          | "client"
          | "items"
          | "products"
          | {
              client?: "authenticated" | "checking" | "unauthenticated";
              items?: "configuring" | "empty";
              products?: "added" | "adding" | "empty";
            };
      };
  tags: never;
}
