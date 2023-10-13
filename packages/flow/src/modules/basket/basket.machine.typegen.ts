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
    dump: "done.invoke.clearing:invocation[0]";
    isAuthenticated: "done.invoke.basketManager.shopping.client.checking:invocation[0]";
  };
  missingImplementations: {
    actions: never;
    delays: never;
    guards: never;
    services:
      | "authSubscription"
      | "check"
      | "claim"
      | "dump"
      | "isAuthenticated";
  };
  eventsCausingActions: {
    clearBasket: "done.invoke.clearing:invocation[0]";
    setBasket: "REFRESH" | "done.invoke.loading:invocation[0]";
    setError:
      | "error.platform.claiming:invocation[0]"
      | "error.platform.loading:invocation[0]";
  };
  eventsCausingDelays: {};
  eventsCausingGuards: {
    hasItems: "";
  };
  eventsCausingServices: {
    authSubscription: "xstate.init";
    check: "SESSION" | "done.invoke.clearing:invocation[0]";
    claim: "AUTHENTICATED";
    dump: "UNAUTHENTICATED";
    isAuthenticated:
      | "done.invoke.claiming:invocation[0]"
      | "done.invoke.loading:invocation[0]";
    queue: "ADD";
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
    | "loading"
    | "shopping"
    | "shopping.client"
    | "shopping.client.authenticated"
    | "shopping.client.checking"
    | "shopping.client.unauthenticated"
    | "shopping.items"
    | "shopping.items.empty"
    | "shopping.items.processed"
    | "shopping.items.processing"
    | "shopping.queue"
    | "shopping.queue.empty"
    | "shopping.queue.processing"
    | "subscribing"
    | {
        checkout?: "additional" | "billing" | "payment" | "shipping";
        shopping?:
          | "client"
          | "items"
          | "queue"
          | {
              client?: "authenticated" | "checking" | "unauthenticated";
              items?: "empty" | "processed" | "processing";
              queue?: "empty" | "processing";
            };
      };
  tags: never;
}
