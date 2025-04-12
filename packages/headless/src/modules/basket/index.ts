// --- external
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import basketMachine from "./basket.machine";

// --- utils
import {
  every,
  find,
  findLast,
  get,
  some,
  isEmpty,
  filter,
  map,
} from "lodash-es";
import { responseCodes } from "../../utils";

// --- types
import type { ActorRef } from "xstate";
import type { BasketProduct } from "../basketProduct";
export * from "./types";

// -----------------------------------------------------------------------------
// create a global instance of the basket machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

const service: any = interpret(basketMachine, {
  devTools: true,
});

// -----------------------------------------------------------------------------

export const useBasket = () => {
  // --- meta functions
  async function isReady() {
    return waitFor(
      service,
      state => {
        const basketReady = ["shopping", "error"].some(state.matches);
        return basketReady;
      },
      {
        timeout: Infinity, // infinity = no timeout
      }
    ).then(state => {
      if (state.matches("error")) {
        return Promise.reject(state.context.error);
      }
      return Promise.resolve();
    });
  }

  function isAvailable() {
    const state = service.getSnapshot();
    return (
      ["shopping", "checkout.configuring", "checkout.available"].some(
        state.matches
      ) && !isEmpty(state?.context?.products)
    );
  }

  function hasProducts() {
    const state = service.getSnapshot();
    return !isEmpty(state?.context?.basket?.products);
  }

  function hasInvalidProducts() {
    const state = service.getSnapshot();
    return some(state?.context?.products, product => !isEmpty(product?.error));
  }

  async function hasPromotions(): Promise<boolean> {
    const state = service.getSnapshot();
    const promotions = get(state, "context.actors.promotions");
    if (!promotions) return false;
    return waitFor(promotions as ActorRef<any>, state =>
      state.matches("complete")
    )
      .then(() => true)
      .catch(() => false);
  }

  async function hasBillingDetails(): Promise<boolean> {
    const state = service.getSnapshot();
    const billingDetails = get(state, "context.actors.billingDetails");
    if (!billingDetails) return false;
    return waitFor(billingDetails as ActorRef<any>, state =>
      state.matches("complete")
    )
      .then(() => true)
      .catch(() => false);
  }

  async function hasCurrency(): Promise<boolean> {
    const state = service.getSnapshot();
    const currency = get(state, "context.actors.currency");
    if (!currency) return false;
    return waitFor(currency as ActorRef<any>, state =>
      state.matches("complete")
    )
      .then(() => true)
      .catch(() => false);
  }

  async function hasFields(): Promise<boolean> {
    const state = service.getSnapshot();
    const customFields = get(state, "context.actors.customFields");
    if (!customFields) return false;
    return waitFor(customFields as ActorRef<any>, state =>
      state.matches("complete")
    )
      .then(() => true)
      .catch(() => false);
  }

  function hasPaymentDetails() {
    const state = service.getSnapshot();
    return ["complete", "available.valid", "available.processing"].some(
      state.matches
    );
  }

  function isReadyForCheckout() {
    const state = service.getSnapshot();
    return [
      "shopping.products.complete",
      "shopping.promotions.complete",
      "shopping.account.complete",
      "shopping.currency.complete",
      "shopping.billingDetails.complete",
      "shopping.customFields.complete",
      "shopping.paymentDetails.available",
    ].some(state.matches);
  }

  function isCheckingOut() {
    const state = service.getSnapshot();
    const paymentState = state.context?.payment?.getSnapshot();

    return (
      paymentState.matches("approving") ||
      ["approving", "checkout", "converting", "paying"].some(state.matches)
    );
  }

  function getBasket() {
    const state = service.getSnapshot();
    return state.context?.basket;
  }

  function hasOrder() {
    const state = service.getSnapshot();
    return ["complete", "failed"].some(state.matches);
    // hasPaid: stateMatches(state, ["complete"]),
    // hasFailed: stateMatches(state, ["failed"]),
  }

  function getInvoice() {
    const state = service.getSnapshot();
    return state.context?.invoice;
  }

  function isOrderPaid() {
    const state = service.getSnapshot();
    return state.matches("complete");
  }

  function isOrderFailed() {
    const state = service.getSnapshot();
    return state.matches("failed");
  }
  // --- basket functions

  function clear() {
    return service.send({ type: "CLEAR" });
  }

  function checkout() {
    return service.send({ type: "CHECKOUT" });
  }

  function refresh(data?: any) {
    service.send({ type: "REFRESH", data });
    return waitFor(service, state =>
      state.matches("shopping.refreshing.processed")
    ).then(() => get(service.getSnapshot(), "context.basket"));
  }

  async function setCurrency(currency: any) {
    return waitFor(service, state => state.matches("shopping"), {
      timeout: 60_000,
    }).then(() => {
      // first check if our currency has change, ie: model.code has changed
      const actor = service.getSnapshot()?.context?.actors?.currency;
      if (!actor) return Promise.reject("Currency service not available");

      const code = currency?.toUpperCase();
      const value = actor.getSnapshot()?.context?.model;

      // if it has not then bail
      if (!code || code == value?.code) return Promise.resolve();

      actor?.send({ type: "SET", data: { code }, update: true });

      // then wait for the paymentGateway actor to be updated
      return waitFor(service as ActorRef<any>, state => {
        return ["processed", "complete", "error"].some(state.matches);
      }).then(state => {
        if (["error"].some(state.matches)) {
          return Promise.reject(state.context.error);
        }
        return Promise.resolve();
      });
    });
  }

  async function addPromotion(coupon: any) {
    return waitFor(service, state => state.matches("shopping"), {
      timeout: 60_000,
    }).then(async () => {
      const actor = service.getSnapshot()?.context?.actors?.promotions;

      if (!actor) return Promise.reject("Promotions service not available");

      if (coupon) {
        actor?.send({ type: "SET", data: { promocode: coupon } });
        const state = await waitFor(service as ActorRef<any>, state =>
          ["valid", "error"].some(state.matches)
        );
        if (state.matches("error")) {
          return Promise.reject(state.context.error);
        }
      }

      actor?.send({ type: "ADD" });

      // then wait for the paymentGateway actor to be updated
      return waitFor(service as ActorRef<any>, state => {
        return ["processed", "complete", "error"].some(state.matches);
      }).then(state => {
        if (["error"].some(state.matches)) {
          return Promise.reject(state.context.error);
        }
        return Promise.resolve();
      });
    });

    // return service.send({
    //   type: "UPDATE_PROMOTIONS",
    //   data: { promodcode: coupon },
    // });
  }

  // --- item functions

  function getProducts(): BasketProduct[] {
    return get(service.getSnapshot(), "context.products", []);
  }

  function getInvalidProducts(): BasketProduct[] {
    const state = service.getSnapshot();
    const products = get(state, "context.products", []);
    return filter(products, product => !isEmpty(product?.error));
  }

  function findProduct(mapping: any): BasketProduct | undefined {
    const products = getProducts();
    return findLast(products, (basketItem: any) =>
      every(mapping, (value, key) => {
        if (key == "id") {
          return basketItem.id == value;
        } else {
          const modelValue = get(basketItem, key);
          return modelValue == value;
        }
      })
    );
  }

  function productExists(mapping: any, pending?: boolean) {
    const products = getProducts();

    return some(products, product =>
      every(mapping, (value, key) => {
        const itemValue = get(product, key);
        const matches = itemValue == value;
        return matches;
      })
    );
  }

  // ---------------------------------------------------------------------------
  return {
    service: service.start(),
    // --- getters
    getSnapshot: () => service.getSnapshot(),
    getBasketId: () => service.getSnapshot()?.context?.basket?.id,
    getCurrency: () => service.getSnapshot()?.context?.basket?.currency,
    getPromotions: () => service.getSnapshot()?.context?.basket?.promotions,
    getPromotionCodes: () =>
      map(service.getSnapshot()?.context?.basket?.promotions, "promotion.code"),
    getTaxes: () => service.getSnapshot()?.context?.basket?.taxes ?? [],
    getErrors: () => service.getSnapshot()?.context?.errors,
    // --- meta functions
    isReady,
    isAvailable,
    hasProducts,
    hasInvalidProducts,
    hasPromotions,
    hasBillingDetails,
    hasCurrency,
    hasFields,
    hasPaymentDetails,
    isReadyForCheckout,
    isCheckingOut,
    hasOrder,
    getBasket,
    getInvoice,
    isOrderPaid,
    isOrderFailed,

    // --- basket functions
    clear,
    checkout,
    refresh,
    setCurrency,
    addPromotion,

    // --- item functions
    getProducts,
    getInvalidProducts,
    findProduct,
    productExists,

    // -- Product functions
    getProduct: async (bpid: string): Promise<ActorRef<any>> => {
      await isReady();
      const target = bpid;
      const products = getProducts();
      const basketItem = find(products, ["id", target]) as
        | ActorRef<any>
        | undefined;

      return new Promise((resolve, reject) => {
        if (basketItem) {
          resolve(basketItem);
        } else {
          reject({
            message: "Basket item not found",
            code: responseCodes.Not_Found,
          });
        }
      });
    },
  };
};
