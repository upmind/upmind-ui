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
    "done.invoke.converting:invocation[0]": {
      type: "done.invoke.converting:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.generating:invocation[0]": {
      type: "done.invoke.generating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.payment": {
      type: "done.invoke.payment";
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
    "error.platform.converting:invocation[0]": {
      type: "error.platform.converting:invocation[0]";
      data: unknown;
    };
    "error.platform.payment": { type: "error.platform.payment"; data: unknown };
    "error.platform.removing:invocation[0]": {
      type: "error.platform.removing:invocation[0]";
      data: unknown;
    };
    "error.platform.updating:invocation[0]": {
      type: "error.platform.updating:invocation[0]";
      data: unknown;
    };
    "xstate.after(wait)#processed": { type: "xstate.after(wait)#processed" };
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    authSubscription: "done.invoke.authCallback";
    claim: "done.invoke.claiming:invocation[0]";
    convert: "done.invoke.converting:invocation[0]";
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
      | "convert"
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
    checkoutActors: "CHECKOUT";
    clearActors: "UNAUTHENTICATED";
    clearBasket: "UNAUTHENTICATED";
    clearBin: "UNAUTHENTICATED" | "UPDATE";
    clearError: "UNAUTHENTICATED";
    clearItems: "CLEAR" | "UNAUTHENTICATED";
    loadItems: "done.invoke.basketManager.loading.basket:invocation[0]";
    muteBasket: "CLEAR" | "REFRESH" | "REMOVE" | "UPDATE";
    refreshActors:
      | "REFRESH"
      | "done.invoke.claiming:invocation[0]"
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.refreshing:invocation[0]";
    refreshItems:
      | "done.invoke.basketManager.shopping.items.processing.everything:invocation[0]"
      | "done.invoke.updating:invocation[0]";
    removeItem: "done.invoke.removing:invocation[0]";
    sendToItem:
      | "UPDATE.ATTRIBUTES"
      | "UPDATE.OPTIONS"
      | "UPDATE.PROVISIONING"
      | "UPDATE.QUANTITY"
      | "UPDATE.TERM";
    setError:
      | "error.platform.basketManager.loading.basket:invocation[0]"
      | "error.platform.basketManager.shopping.items.processing.everything:invocation[0]"
      | "error.platform.claiming:invocation[0]"
      | "error.platform.converting:invocation[0]"
      | "error.platform.payment"
      | "error.platform.removing:invocation[0]"
      | "error.platform.updating:invocation[0]";
    setFeedbackError:
      | "error.platform.basketManager.loading.basket:invocation[0]"
      | "error.platform.basketManager.shopping.items.processing.everything:invocation[0]"
      | "error.platform.claiming:invocation[0]"
      | "error.platform.converting:invocation[0]"
      | "error.platform.payment"
      | "error.platform.removing:invocation[0]"
      | "error.platform.updating:invocation[0]";
    setInvoice: "done.invoke.converting:invocation[0]";
    setPayment: "done.invoke.payment";
    setPaymentDetails: "PAYMENT_DETAILS";
    spawnActors: "done.invoke.basketManager.loading.basket:invocation[0]";
    trackPayment: "done.invoke.payment";
    updateActors: "CLEAR" | "REMOVE" | "UPDATE";
    updateBasket:
      | "REFRESH"
      | "done.invoke.basketManager.loading.basket:invocation[0]"
      | "done.invoke.basketManager.shopping.items.processing.everything:invocation[0]"
      | "done.invoke.claiming:invocation[0]"
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.refreshing:invocation[0]"
      | "done.invoke.removing:invocation[0]"
      | "done.invoke.updating:invocation[0]";
    updateItem: "UPDATE";
    updateItems: "UPDATE";
  };
  eventsCausingDelays: {
    wait:
      | "done.invoke.basketManager.shopping.items.processing.everything:invocation[0]"
      | "done.invoke.removing:invocation[0]"
      | "done.invoke.updating:invocation[0]";
  };
  eventsCausingGuards: {
    billingComplete: "";
    billingConfiguring: "";
    currencyComplete: "";
    currencyConfiguring: "";
    custom_fieldsComplete: "";
    custom_fieldsConfiguring: "";
    hasNewBasket: "REFRESH";
    hasNoBasket: "ADD";
    hasNoItem: "UPDATE";
    hasNoItems: "";
    isNotLoading: "";
    isNotMuted: "REFRESH";
    itemsConfigured: "";
    needsPayment: "done.invoke.converting:invocation[0]";
    paymentConfiguring: "";
    paymentDetailsComplete: "PAYMENT_DETAILS";
    paymentDetailsValid: "";
    promotionsComplete: "";
    promotionsConfiguring: "";
    someConfiguring: "";
  };
  eventsCausingServices: {
    authSubscription:
      | "ADD"
      | "CLEAR"
      | "REFRESH"
      | "REMOVE"
      | "UNAUTHENTICATED"
      | "UPDATE"
      | "xstate.init";
    claim: "AUTHENTICATED";
    convert: "PAYMENT_DETAILS";
    generate: "ADD";
    isAuthenticated:
      | ""
      | "CLEAR"
      | "REFRESH"
      | "REMOVE"
      | "UPDATE"
      | "done.invoke.claiming:invocation[0]"
      | "done.invoke.generating:invocation[0]";
    load: "SESSION";
    payment: "done.invoke.converting:invocation[0]";
    refresh: "REFRESH" | "xstate.after(wait)#processed";
    removeItem: "REMOVE";
    update: "CLEAR" | "REMOVE" | "UPDATE";
    updateItem: "UPDATE";
  };
  matchesStates:
    | "checkout"
    | "checkout.available"
    | "checkout.configuring"
    | "checkout.processing"
    | "claiming"
    | "complete"
    | "converting"
    | "error"
    | "generating"
    | "loading"
    | "loading.actors"
    | "loading.basket"
    | "paying"
    | "shopping"
    | "shopping.account"
    | "shopping.account.checking"
    | "shopping.account.complete"
    | "shopping.account.configuring"
    | "shopping.billing_details"
    | "shopping.billing_details.complete"
    | "shopping.billing_details.configuring"
    | "shopping.currency"
    | "shopping.currency.complete"
    | "shopping.currency.configuring"
    | "shopping.custom_fields"
    | "shopping.custom_fields.complete"
    | "shopping.custom_fields.configuring"
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
    | "shopping.promotions"
    | "shopping.promotions.complete"
    | "shopping.promotions.configuring"
    | "shopping.refreshing"
    | "shopping.refreshing.complete"
    | "shopping.refreshing.processing"
    | "subscribing"
    | {
        checkout?: "available" | "configuring" | "processing";
        loading?: "actors" | "basket";
        shopping?:
          | "account"
          | "billing_details"
          | "currency"
          | "custom_fields"
          | "items"
          | "promotions"
          | "refreshing"
          | {
              account?: "checking" | "complete" | "configuring";
              billing_details?: "complete" | "configuring";
              currency?: "complete" | "configuring";
              custom_fields?: "complete" | "configuring";
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
              promotions?: "complete" | "configuring";
              refreshing?: "complete" | "processing";
            };
      };
  tags: never;
}
