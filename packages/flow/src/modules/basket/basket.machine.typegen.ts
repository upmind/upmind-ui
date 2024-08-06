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
    "done.invoke.basketManager.shopping.refreshing.processing:invocation[0]": {
      type: "done.invoke.basketManager.shopping.refreshing.processing:invocation[0]";
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
    "error.platform.authCallback": {
      type: "error.platform.authCallback";
      data: unknown;
    };
    "error.platform.basketManager.loading.basket:invocation[0]": {
      type: "error.platform.basketManager.loading.basket:invocation[0]";
      data: unknown;
    };
    "error.platform.basketManager.shopping.refreshing.processing:invocation[0]": {
      type: "error.platform.basketManager.shopping.refreshing.processing:invocation[0]";
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
    "xstate.init": { type: "xstate.init" };
  };
  invokeSrcNameMap: {
    authSubscription: "done.invoke.authCallback";
    convert: "done.invoke.converting:invocation[0]";
    generate: "done.invoke.generating:invocation[0]";
    isAuthenticated: "done.invoke.basketManager.shopping.account.checking:invocation[0]";
    load:
      | "done.invoke.basketManager.loading.basket:invocation[0]"
      | "done.invoke.claiming:invocation[0]";
    refresh: "done.invoke.basketManager.shopping.refreshing.processing:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services:
      | "authSubscription"
      | "convert"
      | "generate"
      | "isAuthenticated"
      | "load"
      | "refresh";
  };
  eventsCausingActions: {
    addItem: "ADD";
    cancelController: "AUTHENTICATED" | "REFRESH" | "SESSION";
    checkoutActors: "CHECKOUT";
    clearActors: "UNAUTHENTICATED";
    clearBasket: "UNAUTHENTICATED";
    clearError: "AUTHENTICATED" | "REFRESH" | "SESSION" | "UNAUTHENTICATED";
    clearItems: "CLEAR" | "UNAUTHENTICATED";
    loadItems: "done.invoke.basketManager.loading.basket:invocation[0]";
    newController: "AUTHENTICATED" | "REFRESH" | "SESSION";
    refreshActors:
      | "REFRESH"
      | "done.invoke.basketManager.shopping.refreshing.processing:invocation[0]"
      | "done.invoke.claiming:invocation[0]"
      | "done.invoke.generating:invocation[0]";
    setError:
      | "error.platform.basketManager.loading.basket:invocation[0]"
      | "error.platform.basketManager.shopping.refreshing.processing:invocation[0]"
      | "error.platform.claiming:invocation[0]"
      | "error.platform.converting:invocation[0]"
      | "error.platform.payment";
    setFeedbackError:
      | "error.platform.basketManager.loading.basket:invocation[0]"
      | "error.platform.claiming:invocation[0]"
      | "error.platform.converting:invocation[0]"
      | "error.platform.payment";
    setInvoice: "done.invoke.converting:invocation[0]";
    setPayment: "done.invoke.payment";
    setPaymentDetails: "PAYMENT_DETAILS";
    spawnActors: "done.invoke.basketManager.loading.basket:invocation[0]";
    trackPayment: "done.invoke.payment";
    updateBasket:
      | "REFRESH"
      | "done.invoke.basketManager.loading.basket:invocation[0]"
      | "done.invoke.basketManager.shopping.refreshing.processing:invocation[0]"
      | "done.invoke.claiming:invocation[0]"
      | "done.invoke.generating:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    billingComplete: "";
    billingConfiguring: "";
    currencyComplete: "";
    currencyConfiguring: "";
    custom_fieldsComplete: "";
    custom_fieldsConfiguring: "";
    hasNewBasket: "REFRESH";
    hasNoBasket: "ADD";
    hasNoItems: "";
    isNotCancelled: "error.platform.basketManager.shopping.refreshing.processing:invocation[0]";
    isNotLoading: "";
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
      | "UNAUTHENTICATED"
      | "xstate.init";
    convert: "PAYMENT_DETAILS";
    generate: "ADD";
    isAuthenticated:
      | ""
      | "CLEAR"
      | "REFRESH"
      | "done.invoke.claiming:invocation[0]"
      | "done.invoke.generating:invocation[0]";
    load: "AUTHENTICATED" | "SESSION";
    payment: "done.invoke.converting:invocation[0]";
    refresh: "REFRESH";
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
    | "failed"
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
              items?: "complete" | "configuring" | "empty";
              promotions?: "complete" | "configuring";
              refreshing?: "complete" | "processing";
            };
      };
  tags: never;
}
