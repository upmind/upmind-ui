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
    "done.invoke.basketManager.shopping.billing.processing:invocation[0]": {
      type: "done.invoke.basketManager.shopping.billing.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.basketManager.shopping.currency.processing:invocation[0]": {
      type: "done.invoke.basketManager.shopping.currency.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.basketManager.shopping.custom_fields.checking:invocation[0]": {
      type: "done.invoke.basketManager.shopping.custom_fields.checking:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.basketManager.shopping.custom_fields.loading:invocation[0]": {
      type: "done.invoke.basketManager.shopping.custom_fields.loading:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.basketManager.shopping.custom_fields.processing:invocation[0]": {
      type: "done.invoke.basketManager.shopping.custom_fields.processing:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.basketManager.shopping.items.processing.everything:invocation[0]": {
      type: "done.invoke.basketManager.shopping.items.processing.everything:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.basketManager.shopping.promotions.adding:invocation[0]": {
      type: "done.invoke.basketManager.shopping.promotions.adding:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "done.invoke.basketManager.shopping.promotions.removing:invocation[0]": {
      type: "done.invoke.basketManager.shopping.promotions.removing:invocation[0]";
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
    "error.platform.basketManager.shopping.billing.processing:invocation[0]": {
      type: "error.platform.basketManager.shopping.billing.processing:invocation[0]";
      data: unknown;
    };
    "error.platform.basketManager.shopping.currency.processing:invocation[0]": {
      type: "error.platform.basketManager.shopping.currency.processing:invocation[0]";
      data: unknown;
    };
    "error.platform.basketManager.shopping.custom_fields.checking:invocation[0]": {
      type: "error.platform.basketManager.shopping.custom_fields.checking:invocation[0]";
      data: unknown;
    };
    "error.platform.basketManager.shopping.custom_fields.loading:invocation[0]": {
      type: "error.platform.basketManager.shopping.custom_fields.loading:invocation[0]";
      data: unknown;
    };
    "error.platform.basketManager.shopping.custom_fields.processing:invocation[0]": {
      type: "error.platform.basketManager.shopping.custom_fields.processing:invocation[0]";
      data: unknown;
    };
    "error.platform.basketManager.shopping.items.processing.everything:invocation[0]": {
      type: "error.platform.basketManager.shopping.items.processing.everything:invocation[0]";
      data: unknown;
    };
    "error.platform.basketManager.shopping.promotions.adding:invocation[0]": {
      type: "error.platform.basketManager.shopping.promotions.adding:invocation[0]";
      data: unknown;
    };
    "error.platform.basketManager.shopping.promotions.removing:invocation[0]": {
      type: "error.platform.basketManager.shopping.promotions.removing:invocation[0]";
      data: unknown;
    };
    "error.platform.claiming:invocation[0]": {
      type: "error.platform.claiming:invocation[0]";
      data: unknown;
    };
    "error.platform.payment_details": {
      type: "error.platform.payment_details";
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
    addPromotion: "done.invoke.basketManager.shopping.promotions.adding:invocation[0]";
    authSubscription: "done.invoke.authCallback";
    check: "done.invoke.basketManager.loading.basket:invocation[0]";
    claim: "done.invoke.claiming:invocation[0]";
    generate: "done.invoke.generating:invocation[0]";
    getCustomFields: "done.invoke.basketManager.shopping.custom_fields.loading:invocation[0]";
    isAuthenticated: "done.invoke.basketManager.shopping.client.checking:invocation[0]";
    removeItem: "done.invoke.removing:invocation[0]";
    removePromotion: "done.invoke.basketManager.shopping.promotions.removing:invocation[0]";
    setBilling: "done.invoke.basketManager.shopping.billing.processing:invocation[0]";
    setCurrency: "done.invoke.basketManager.shopping.currency.processing:invocation[0]";
    setFields: "done.invoke.basketManager.shopping.custom_fields.processing:invocation[0]";
    update: "done.invoke.basketManager.shopping.items.processing.everything:invocation[0]";
    updateItem: "done.invoke.updating:invocation[0]";
    validateFields: "done.invoke.basketManager.shopping.custom_fields.checking:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services:
      | "addPromotion"
      | "authSubscription"
      | "check"
      | "claim"
      | "generate"
      | "getCustomFields"
      | "isAuthenticated"
      | "removeItem"
      | "removePromotion"
      | "setBilling"
      | "setCurrency"
      | "setFields"
      | "update"
      | "updateItem"
      | "validateFields";
  };
  eventsCausingActions: {
    addItem: "ADD";
    binItem: "REMOVE";
    clearBasket: "UNAUTHENTICATED";
    clearError:
      | "CLEAR.FIELDS"
      | "SET.FIELDS"
      | "UNAUTHENTICATED"
      | "done.invoke.basketManager.shopping.custom_fields.loading:invocation[0]";
    clearFieldsModel: "CLEAR.FIELDS" | "UNAUTHENTICATED";
    clearQueue: "UNAUTHENTICATED" | "UPDATE";
    clearSchemas: "UNAUTHENTICATED";
    loadItems: "done.invoke.basketManager.loading.basket:invocation[0]";
    queueItem: "UPDATE";
    refreshItems:
      | "done.invoke.basketManager.shopping.billing.processing:invocation[0]"
      | "done.invoke.basketManager.shopping.currency.processing:invocation[0]"
      | "done.invoke.basketManager.shopping.items.processing.everything:invocation[0]"
      | "done.invoke.basketManager.shopping.promotions.adding:invocation[0]"
      | "done.invoke.basketManager.shopping.promotions.removing:invocation[0]"
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
      | "error.platform.basketManager.shopping.billing.processing:invocation[0]"
      | "error.platform.basketManager.shopping.currency.processing:invocation[0]"
      | "error.platform.basketManager.shopping.custom_fields.checking:invocation[0]"
      | "error.platform.basketManager.shopping.custom_fields.loading:invocation[0]"
      | "error.platform.basketManager.shopping.custom_fields.processing:invocation[0]"
      | "error.platform.basketManager.shopping.items.processing.everything:invocation[0]"
      | "error.platform.basketManager.shopping.promotions.adding:invocation[0]"
      | "error.platform.basketManager.shopping.promotions.removing:invocation[0]"
      | "error.platform.claiming:invocation[0]"
      | "error.platform.payment_details"
      | "error.platform.removing:invocation[0]"
      | "error.platform.updating:invocation[0]";
    setFeedbackError:
      | "error.platform.basketManager.loading.basket:invocation[0]"
      | "error.platform.basketManager.shopping.billing.processing:invocation[0]"
      | "error.platform.basketManager.shopping.currency.processing:invocation[0]"
      | "error.platform.basketManager.shopping.custom_fields.processing:invocation[0]"
      | "error.platform.basketManager.shopping.items.processing.everything:invocation[0]"
      | "error.platform.basketManager.shopping.promotions.adding:invocation[0]"
      | "error.platform.basketManager.shopping.promotions.removing:invocation[0]"
      | "error.platform.claiming:invocation[0]"
      | "error.platform.removing:invocation[0]"
      | "error.platform.updating:invocation[0]";
    setFeedbackSuccess:
      | "done.invoke.basketManager.shopping.billing.processing:invocation[0]"
      | "done.invoke.basketManager.shopping.currency.processing:invocation[0]"
      | "done.invoke.basketManager.shopping.custom_fields.processing:invocation[0]"
      | "done.invoke.basketManager.shopping.items.processing.everything:invocation[0]"
      | "done.invoke.basketManager.shopping.promotions.adding:invocation[0]"
      | "done.invoke.basketManager.shopping.promotions.removing:invocation[0]"
      | "done.invoke.removing:invocation[0]"
      | "done.invoke.updating:invocation[0]";
    setFields: "done.invoke.basketManager.shopping.custom_fields.loading:invocation[0]";
    setFieldsModel: "SET.FIELDS";
    setFieldsSchemas: "done.invoke.basketManager.shopping.custom_fields.loading:invocation[0]";
    updateBasket:
      | "done.invoke.basketManager.shopping.billing.processing:invocation[0]"
      | "done.invoke.basketManager.shopping.currency.processing:invocation[0]"
      | "done.invoke.basketManager.shopping.custom_fields.processing:invocation[0]"
      | "done.invoke.basketManager.shopping.items.processing.everything:invocation[0]"
      | "done.invoke.basketManager.shopping.promotions.adding:invocation[0]"
      | "done.invoke.basketManager.shopping.promotions.removing:invocation[0]"
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
    hasBilling: "";
    hasCurrency: "";
    hasDirtyFields: "done.invoke.basketManager.shopping.custom_fields.checking:invocation[0]";
    hasFields: "CLEAR.FIELDS" | "SET.FIELDS" | "UPDATE.FIELDS";
    hasNoBasket: "ADD";
    hasNoBilling: "";
    hasNoCurrency: "";
    hasNoDirtyFields: "";
    hasNoItem: "UPDATE";
    hasNoItems: "";
    hasNoPromotions: "";
    hasPromotions: "";
    isNotLoading: "";
    isNotQueued: "UPDATE";
    notSameAddress: "UPDATE.ADDRESS";
    notSameCompany: "UPDATE.COMPANY";
    notSameCurrency: "UPDATE.CURRENCY";
    someConfiguring: "";
  };
  eventsCausingServices: {
    addPromotion: "ADD.PROMOTION";
    authSubscription: "UNAUTHENTICATED" | "xstate.init";
    check: "REFRESH" | "SESSION" | "UNAUTHENTICATED";
    claim: "AUTHENTICATED";
    generate: "ADD";
    getCustomFields:
      | ""
      | "CLEAR.FIELDS"
      | "SET.FIELDS"
      | "UPDATE.FIELDS"
      | "done.invoke.claiming:invocation[0]"
      | "done.invoke.generating:invocation[0]";
    isAuthenticated:
      | ""
      | "done.invoke.claiming:invocation[0]"
      | "done.invoke.generating:invocation[0]";
    payment_details:
      | ""
      | "done.invoke.claiming:invocation[0]"
      | "done.invoke.generating:invocation[0]";
    removeItem: "REMOVE";
    removePromotion: "REMOVE.PROMOTION";
    setBilling: "UPDATE.ADDRESS" | "UPDATE.COMPANY";
    setCurrency: "UPDATE.CURRENCY";
    setFields: "UPDATE.FIELDS";
    update: "CLEAR" | "REMOVE" | "UPDATE";
    updateItem: "UPDATE";
    validateFields:
      | "CLEAR.FIELDS"
      | "SET.FIELDS"
      | "done.invoke.basketManager.shopping.custom_fields.loading:invocation[0]";
  };
  matchesStates:
    | "checkout"
    | "checkout.payment"
    | "claiming"
    | "complete"
    | "error"
    | "generating"
    | "loading"
    | "loading.basket"
    | "loading.items"
    | "shopping"
    | "shopping.billing"
    | "shopping.billing.complete"
    | "shopping.billing.empty"
    | "shopping.billing.error"
    | "shopping.billing.processing"
    | "shopping.client"
    | "shopping.client.authenticated"
    | "shopping.client.checking"
    | "shopping.client.unauthenticated"
    | "shopping.currency"
    | "shopping.currency.complete"
    | "shopping.currency.empty"
    | "shopping.currency.error"
    | "shopping.currency.processing"
    | "shopping.custom_fields"
    | "shopping.custom_fields.checking"
    | "shopping.custom_fields.complete"
    | "shopping.custom_fields.error"
    | "shopping.custom_fields.invalid"
    | "shopping.custom_fields.loading"
    | "shopping.custom_fields.processing"
    | "shopping.custom_fields.valid"
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
    | "shopping.payment_details.complete"
    | "shopping.payment_details.processing"
    | "shopping.promotions"
    | "shopping.promotions.active"
    | "shopping.promotions.adding"
    | "shopping.promotions.empty"
    | "shopping.promotions.error"
    | "shopping.promotions.removing"
    | "subscribing"
    | {
        checkout?: "payment";
        loading?: "basket" | "items";
        shopping?:
          | "billing"
          | "client"
          | "currency"
          | "custom_fields"
          | "items"
          | "payment_details"
          | "promotions"
          | {
              billing?: "complete" | "empty" | "error" | "processing";
              client?: "authenticated" | "checking" | "unauthenticated";
              currency?: "complete" | "empty" | "error" | "processing";
              custom_fields?:
                | "checking"
                | "complete"
                | "error"
                | "invalid"
                | "loading"
                | "processing"
                | "valid";
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
              payment_details?: "complete" | "processing";
              promotions?: "active" | "adding" | "empty" | "error" | "removing";
            };
      };
  tags: never;
}
