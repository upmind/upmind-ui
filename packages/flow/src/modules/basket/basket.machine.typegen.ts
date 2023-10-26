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
    "done.invoke.removing:invocation[0]": {
      type: "done.invoke.removing:invocation[0]";
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
    removeFromBasket: "done.invoke.removing:invocation[0]";
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
      | "isAuthenticated"
      | "removeFromBasket";
  };
  eventsCausingActions: {
    addItem: "ADD";
    binItem: "REMOVE";
    clearBasket: "UNAUTHENTICATED";
    loadItems: "done.invoke.loading:invocation[0]";
    removeItem: "done.invoke.removing:invocation[0]";
    replaceItem: "done.invoke.adding:invocation[0]";
    sendToItem:
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM";
    setBasket:
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.loading:invocation[0]";
    setError:
      | "error.platform.claiming:invocation[0]"
      | "error.platform.loading:invocation[0]";
    updateBasket:
      | "done.invoke.adding:invocation[0]"
      | "done.invoke.removing:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    allConfigured: "";
    hasBinnedItems: "";
    hasItems: "";
    hasNewItems: "";
    hasNoBasket: "ADD";
    hasNoItems: "";
  };
  eventsCausingServices: {
    addToBasket: "";
    authSubscription: "xstate.init";
    check: "SESSION" | "UNAUTHENTICATED";
    claim: "AUTHENTICATED";
    generate: "ADD";
    isAuthenticated:
      | "done.invoke.claiming:invocation[0]"
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.loading:invocation[0]";
    removeFromBasket: "";
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
    | "shopping.items.adding"
    | "shopping.items.configured"
    | "shopping.items.configuring"
    | "shopping.items.empty"
    | "shopping.items.removing"
    | "subscribing"
    | {
        checkout?: "additional" | "billing" | "payment" | "shipping";
        shopping?:
          | "client"
          | "items"
          | {
              client?: "authenticated" | "checking" | "unauthenticated";
              items?:
                | "adding"
                | "configured"
                | "configuring"
                | "empty"
                | "removing";
            };
      };
  tags: never;
}
