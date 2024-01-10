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
    "done.invoke.basketManager.shopping.items.processing.currency:invocation[0]": {
      type: "done.invoke.basketManager.shopping.items.processing.currency:invocation[0]";
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
    "done.invoke.updating:invocation[0]": {
      type: "done.invoke.updating:invocation[0]";
      data: unknown;
      __tip: "See the XState TS docs to learn how to strongly type this.";
    };
    "error.platform.authCallback": {
      type: "error.platform.authCallback";
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
    "error.platform.basketManager.shopping.items.processing.currency:invocation[0]": {
      type: "error.platform.basketManager.shopping.items.processing.currency:invocation[0]";
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
    "error.platform.loading:invocation[0]": {
      type: "error.platform.loading:invocation[0]";
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
    check: "done.invoke.loading:invocation[0]";
    claim: "done.invoke.claiming:invocation[0]";
    generate: "done.invoke.generating:invocation[0]";
    getCustomFields: "done.invoke.basketManager.shopping.custom_fields.loading:invocation[0]";
    isAuthenticated: "done.invoke.basketManager.shopping.client.checking:invocation[0]";
    removeItem: "done.invoke.removing:invocation[0]";
    removePromotion: "done.invoke.basketManager.shopping.promotions.removing:invocation[0]";
    setCurrency: "done.invoke.basketManager.shopping.items.processing.currency:invocation[0]";
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
    clearError: "CLEAR.ERRORS" | "SET.FIELDS";
    clearFieldsModel: "CLEAR.FIELDS";
    clearQueue: "UPDATE";
    loadItems: "done.invoke.loading:invocation[0]";
    queueItem: "UPDATE";
    refreshItems:
      | "done.invoke.basketManager.shopping.items.processing.currency:invocation[0]"
      | "done.invoke.basketManager.shopping.items.processing.everything:invocation[0]"
      | "done.invoke.basketManager.shopping.promotions.adding:invocation[0]"
      | "done.invoke.basketManager.shopping.promotions.removing:invocation[0]"
      | "done.invoke.updating:invocation[0]"
      | "error.platform.basketManager.shopping.items.processing.everything:invocation[0]"
      | "error.platform.removing:invocation[0]"
      | "error.platform.updating:invocation[0]";
    removeAllItems: "CLEAR";
    removeFromQueue: "done.invoke.updating:invocation[0]";
    removeItem: "done.invoke.removing:invocation[0]";
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
      | "error.platform.basketManager.shopping.custom_fields.checking:invocation[0]"
      | "error.platform.basketManager.shopping.custom_fields.loading:invocation[0]"
      | "error.platform.basketManager.shopping.custom_fields.processing:invocation[0]"
      | "error.platform.basketManager.shopping.items.processing.currency:invocation[0]"
      | "error.platform.basketManager.shopping.items.processing.everything:invocation[0]"
      | "error.platform.basketManager.shopping.promotions.adding:invocation[0]"
      | "error.platform.basketManager.shopping.promotions.removing:invocation[0]"
      | "error.platform.claiming:invocation[0]"
      | "error.platform.loading:invocation[0]"
      | "error.platform.removing:invocation[0]"
      | "error.platform.updating:invocation[0]";
    setFields: "done.invoke.basketManager.shopping.custom_fields.loading:invocation[0]";
    setFieldsModel: "SET.FIELDS";
    setFieldsSchemas: "done.invoke.basketManager.shopping.custom_fields.loading:invocation[0]";
    setSuccess:
      | "done.invoke.basketManager.shopping.custom_fields.processing:invocation[0]"
      | "done.invoke.basketManager.shopping.items.processing.currency:invocation[0]"
      | "done.invoke.basketManager.shopping.items.processing.everything:invocation[0]"
      | "done.invoke.basketManager.shopping.promotions.adding:invocation[0]"
      | "done.invoke.basketManager.shopping.promotions.removing:invocation[0]"
      | "done.invoke.removing:invocation[0]"
      | "done.invoke.updating:invocation[0]";
    updateBasket:
      | "done.invoke.basketManager.shopping.custom_fields.processing:invocation[0]"
      | "done.invoke.basketManager.shopping.items.processing.currency:invocation[0]"
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
    error: "error.platform.basketManager.shopping.items.processing.currency:invocation[0]";
    wait:
      | "done.invoke.basketManager.shopping.items.processing.currency:invocation[0]"
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
    hasNoFields: "";
    hasNoItem: "UPDATE";
    hasNoItems: "";
    hasNoPromotions: "";
    hasPromotions: "";
    isNotQueued: "UPDATE";
    someConfiguring: "";
  };
  eventsCausingServices: {
    addPromotion: "ADD.PROMOTION";
    authSubscription: "xstate.init";
    check: "SESSION" | "UNAUTHENTICATED";
    claim: "AUTHENTICATED";
    generate: "ADD";
    getCustomFields:
      | "CLEAR.ERRORS"
      | "CLEAR.FIELDS"
      | "SET.FIELDS"
      | "UPDATE.FIELDS"
      | "done.invoke.claiming:invocation[0]"
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.loading:invocation[0]";
    isAuthenticated:
      | "CLEAR.ERRORS"
      | "done.invoke.claiming:invocation[0]"
      | "done.invoke.generating:invocation[0]"
      | "done.invoke.loading:invocation[0]";
    removeItem: "REMOVE";
    removePromotion: "REMOVE.PROMOTION";
    setCurrency: "UPDATE.CURRENCY";
    setFields: "UPDATE.FIELDS";
    update: "CLEAR" | "REMOVE" | "UPDATE" | "UPDATE.CURRENCY";
    updateItem: "UPDATE";
    validateFields: "SET.FIELDS";
  };
  matchesStates:
    | "checkout"
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
    | "shopping.custom_fields"
    | "shopping.custom_fields.checking"
    | "shopping.custom_fields.complete"
    | "shopping.custom_fields.error"
    | "shopping.custom_fields.idle"
    | "shopping.custom_fields.invalid"
    | "shopping.custom_fields.loading"
    | "shopping.custom_fields.processing"
    | "shopping.custom_fields.valid"
    | "shopping.items"
    | "shopping.items.configured"
    | "shopping.items.configuring"
    | "shopping.items.empty"
    | "shopping.items.processed"
    | "shopping.items.processing"
    | "shopping.items.processing.currency"
    | "shopping.items.processing.error"
    | "shopping.items.processing.everything"
    | "shopping.items.processing.removing"
    | "shopping.items.processing.updating"
    | "shopping.promotions"
    | "shopping.promotions.active"
    | "shopping.promotions.adding"
    | "shopping.promotions.empty"
    | "shopping.promotions.error"
    | "shopping.promotions.removing"
    | "subscribing"
    | {
        checkout?: "billing" | "payment" | "shipping";
        shopping?:
          | "client"
          | "custom_fields"
          | "items"
          | "promotions"
          | {
              client?: "authenticated" | "checking" | "unauthenticated";
              custom_fields?:
                | "checking"
                | "complete"
                | "error"
                | "idle"
                | "invalid"
                | "loading"
                | "processing"
                | "valid";
              items?:
                | "configured"
                | "configuring"
                | "empty"
                | "processed"
                | "processing"
                | {
                    processing?:
                      | "currency"
                      | "error"
                      | "everything"
                      | "removing"
                      | "updating";
                  };
              promotions?: "active" | "adding" | "empty" | "error" | "removing";
            };
      };
  tags: never;
}
