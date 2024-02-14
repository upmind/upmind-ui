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
    "done.invoke.basketManager.loading.basket:invocation[0]": {
      type: "done.invoke.basketManager.loading.basket:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.basketManager.shopping.items.processing.everything:invocation[0]": {
      type: "done.invoke.basketManager.shopping.items.processing.everything:invocation[0]";
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
    "done.invoke.refreshing:invocation[0]": {
      type: "done.invoke.refreshing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.removing:invocation[0]": {
      type: "done.invoke.removing:invocation[0]";
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
    "error.platform.basketManager.loading.basket:invocation[0]": {
      type: "error.platform.basketManager.loading.basket:invocation[0]";
      data: unknown;
    };
    "error.platform.basketManager.shopping.items.processing.everything:invocation[0]": {
      type: "error.platform.basketManager.shopping.items.processing.everything:invocation[0]";
      data: unknown;
    };
    "error.platform.claiming:invocation[0]": {
      type: "error.platform.claiming:invocation[0]";
      data: unknown;
    };
    "error.platform.removing:invocation[0]": {
      type: "error.platform.removing:invocation[0]";
      data: unknown;
    };
    "error.platform.updating:invocation[0]": {
      type: "error.platform.updating:invocation[0]";
      data: unknown;
    };
    "xstate.after(error)#basketManager.shopping.items.processing.error": {
      type: "xstate.after(error)#basketManager.shopping.items.processing.error";
    };
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    authSubscription: "done.invoke.authCallback";
    claim: "done.invoke.claiming:invocation[0]";
    generate: "done.invoke.generating:invocation[0]";
    isAuthenticated: "done.invoke.basketManager.shopping.account.checking:invocation[0]";
    load: "done.invoke.basketManager.loading.basket:invocation[0]";
    refresh: "done.invoke.refreshing:invocation[0]";
    removeItem: "done.invoke.removing:invocation[0]";
    update: "done.invoke.basketManager.shopping.items.processing.everything:invocation[0]";
    updateItem: "done.invoke.updating:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services:
      | "authSubscription"
      | "claim"
      | "generate"
      | "isAuthenticated"
      | "load"
      | "refresh"
      | "removeItem"
      | "update"
      | "updateItem";
  };
  eventsCausingActions: {
    addItem: "ADD";
    binItem: "REMOVE";
    clearBasket: "UNAUTHENTICATED";
    clearError: "UNAUTHENTICATED";
    clearQueue: "UNAUTHENTICATED" | "UPDATE";
    loadItems: "done.invoke.basketManager.loading.basket:invocation[0]";
    queueItem: "UPDATE";
    refreshItems:
      | "done.invoke.basketManager.shopping.items.processing.everything:invocation[0]"
      | "done.invoke.refreshing:invocation[0]"
      | "done.invoke.updating:invocation[0]"
      | "error.platform.basketManager.shopping.items.processing.everything:invocation[0]"
      | "error.platform.removing:invocation[0]"
      | "error.platform.updating:invocation[0]";
    removeAllItems: "CLEAR" | "UNAUTHENTICATED";
    removeFromQueue: "done.invoke.updating:invocation[0]";
    removeItem: "done.invoke.removing:invocation[0]";
    sendToItem:
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM";
    setBasket:
      | "done.invoke.basketManager.loading.basket:invocation[0]"
      | "done.invoke.generating:invocation[0]";
    setError:
      | "error.platform.basketManager.loading.basket:invocation[0]"
      | "error.platform.basketManager.shopping.items.processing.everything:invocation[0]"
      | "error.platform.claiming:invocation[0]"
      | "error.platform.removing:invocation[0]"
      | "error.platform.updating:invocation[0]";
    setFeedbackError:
      | "error.platform.basketManager.loading.basket:invocation[0]"
      | "error.platform.basketManager.shopping.items.processing.everything:invocation[0]"
      | "error.platform.claiming:invocation[0]"
      | "error.platform.removing:invocation[0]"
      | "error.platform.updating:invocation[0]";
    setFeedbackSuccess:
      | "done.invoke.basketManager.shopping.items.processing.everything:invocation[0]"
      | "done.invoke.removing:invocation[0]"
      | "done.invoke.updating:invocation[0]";
    updateBasket:
      | "done.invoke.basketManager.shopping.items.processing.everything:invocation[0]"
      | "done.invoke.refreshing:invocation[0]"
      | "done.invoke.removing:invocation[0]"
      | "done.invoke.updating:invocation[0]"
      | "error.platform.basketManager.shopping.items.processing.everything:invocation[0]"
      | "error.platform.removing:invocation[0]"
      | "error.platform.updating:invocation[0]";
  };
  eventsCausingDelays: {
    wait:
      | "done.invoke.basketManager.shopping.items.processing.everything:invocation[0]"
      | "done.invoke.removing:invocation[0]"
      | "done.invoke.updating:invocation[0]"
      | "error.platform.basketManager.shopping.items.processing.everything:invocation[0]"
      | "error.platform.removing:invocation[0]"
      | "xstate.after(error)#basketManager.shopping.items.processing.error";
  };
  eventsCausingGuards: {
    allConfigured: "";
    hasNoBasket: "ADD";
    hasNoItem: "UPDATE";
    hasNoItems: "";
    isNotLoading: "";
    isNotQueued: "UPDATE";
    isOrder: "done.invoke.basketManager.loading.basket:invocation[0]";
    someConfiguring: "";
  };
  eventsCausingServices: {
    authSubscription: "UNAUTHENTICATED" | "xstate.init";
    billing_details:
      | ""
      | "done.invoke.claiming:invocation[0]"
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.refreshing:invocation[0]";
    claim: "AUTHENTICATED";
    currency:
      | ""
      | "done.invoke.claiming:invocation[0]"
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.refreshing:invocation[0]";
    custom_fields:
      | ""
      | "done.invoke.claiming:invocation[0]"
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.refreshing:invocation[0]";
    generate: "ADD";
    isAuthenticated:
      | ""
      | "done.invoke.claiming:invocation[0]"
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.refreshing:invocation[0]";
    load: "SESSION" | "UNAUTHENTICATED";
    payment_details:
      | ""
      | "done.invoke.claiming:invocation[0]"
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.refreshing:invocation[0]";
    promotions:
      | ""
      | "done.invoke.claiming:invocation[0]"
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.refreshing:invocation[0]";
    refresh: "REFRESH";
    removeItem: "REMOVE";
    update: "CLEAR" | "REMOVE" | "UPDATE";
    updateItem: "UPDATE";
  };
  matchesStates:
    | "claiming"
    | "complete"
    | "error"
    | "generating"
    | "loading"
    | "loading.basket"
    | "loading.items"
    | "refreshing"
    | "shopping"
    | "shopping.account"
    | "shopping.account.authenticated"
    | "shopping.account.checking"
    | "shopping.account.unauthenticated"
    | "shopping.billing_details"
    | "shopping.currency"
    | "shopping.custom_fields"
    | "shopping.items"
    | "shopping.items.complete"
    | "shopping.items.configuring"
    | "shopping.items.empty"
    | "shopping.items.processed"
    | "shopping.items.processing"
    | "shopping.items.processing.error"
    | "shopping.items.processing.everything"
    | "shopping.items.processing.removing"
    | "shopping.items.processing.updating"
    | "shopping.payment_details"
    | "shopping.promotions"
    | "subscribing"
    | {
        loading?: "basket" | "items";
        shopping?:
          | "account"
          | "billing_details"
          | "currency"
          | "custom_fields"
          | "items"
          | "payment_details"
          | "promotions"
          | {
              account?: "authenticated" | "checking" | "unauthenticated";
              items?:
                | "complete"
                | "configuring"
                | "empty"
                | "processed"
                | "processing"
                | {
                    processing?:
                      | "error"
                      | "everything"
                      | "removing"
                      | "updating";
                  };
            };
      };
  tags: never;
}
