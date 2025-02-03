// --- external
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import basketMachine from "./basket.machine";
export { useBasketProductConfig, useBasketProduct } from "./products";

// --- utils
import {
  every,
  find,
  findLast,
  get,
  some,
  omitBy,
  isNil,
  isEqual,
  last,
  isEmpty,
  filter,
} from "lodash-es";
import { responseCodes } from "../api";

// --- types
import type { ActorRef } from "xstate";
import type { ProductModel } from "../product/types";
import type { BasketProduct } from "./types";
export * from "./types";
// --------------------------------------------------------
// create a global instance of the basket machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

// @ts-ignore
const service = interpret(basketMachine, { devTools: true });

// --------------------------------------------------------
// methods
// --------------------------------------------------------
function exists(items: ActorRef<any, any>[] = [], mapping: any, context: any) {
  // @ts-ignore
  context = context ? `${context}.` : "";
  return some(items, item =>
    every(mapping, (value, key) => {
      const itemValue = get(item, `${context}${key}`, get(item, key));
      const matches = itemValue == value;
      return matches;
    })
  );
}

async function sendToItem(itemId: any, type: any, data: any) {
  const item = find(service.getSnapshot()?.context?.items, ["id", itemId]);

  if (item) {
    item.send({ type, data });
    return Promise.resolve(item);
  } else {
    return Promise.reject({
      message: "Item not found",
      code: responseCodes.Not_Found,
    });
  }
}

/**
 * @ignore
 */
export const useBasket = () => {
  // --- meta functions
  async function isReady() {
    return waitFor(
      service,
      state => {
        const basketReady = ["shopping"].some(state.matches);
        // const productsReady = every(
        //   state.context?.items,
        //   s => !["subscribing", "loading"].some(s.state.matches)
        // );
        return basketReady; //&& productsReady;
      },
      {
        timeout: Infinity, // infinity = no timeout
      }
    );
  }

  function isAvailable() {
    const state = service.getSnapshot();
    return (
      [
        "claiming",
        "generating",
        "shopping",
        "checkout.configuring",
        "checkout.available",
      ].some(state.matches) && !isEmpty(state?.context?.products)
    );
  }

  function hasProducts() {
    const state = service.getSnapshot();
    return !isEmpty(state?.context?.products);
  }

  function hasInvalidProducts() {
    const state = service.getSnapshot();
    return some(state?.context?.products, product => !isEmpty(product?.error));
  }

  async function hasPromotions(): Promise<boolean> {
    const state = service.getSnapshot();
    const promotions = get(state, "context.actors.promotions");
    if (!promotions) return false;
    return waitFor(promotions as ActorRef<any, any>, state =>
      state.matches("complete")
    )
      .then(() => true)
      .catch(() => false);
  }

  async function hasBillingDetails(): Promise<boolean> {
    const state = service.getSnapshot();
    const billingDetails = get(state, "context.actors.billingDetails");
    if (!billingDetails) return false;
    return waitFor(billingDetails as ActorRef<any, any>, state =>
      state.matches("complete")
    )
      .then(() => true)
      .catch(() => false);
  }

  async function hasCurrency(): Promise<boolean> {
    const state = service.getSnapshot();
    const currency = get(state, "context.actors.currency");
    if (!currency) return false;
    return waitFor(currency as ActorRef<any, any>, state =>
      state.matches("complete")
    )
      .then(() => true)
      .catch(() => false);
  }

  async function hasFields(): Promise<boolean> {
    const state = service.getSnapshot();
    const customFields = get(state, "context.actors.customFields");
    if (!customFields) return false;
    return waitFor(customFields as ActorRef<any, any>, state =>
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
    ).then(() => service.getSnapshot());
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
      return waitFor(service as ActorRef<any, any>, state => {
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
        const state = await waitFor(service as ActorRef<any, any>, state =>
          ["valid", "error"].some(state.matches)
        );
        if (state.matches("error")) {
          return Promise.reject(state.context.error);
        }
      }

      actor?.send({ type: "ADD" });

      // then wait for the paymentGateway actor to be updated
      return waitFor(service as ActorRef<any, any>, state => {
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

  // TODO
  // setLocale: async (lang: any) => {
  //   return service.send({ type: "UPDATE_LOCALE", data: lang });
  // },

  // --- item functions

  function getProducts(): ActorRef<any, any>[] {
    return get(service.getSnapshot(), "context.products", []) as ActorRef<
      any,
      any
    >[];
  }

  function getPendingProducts(): ActorRef<any, any>[] {
    return get(service.getSnapshot(), "context.items", []) as ActorRef<
      any,
      any
    >[];
  }

  function getInvalidProducts(): BasketProduct[] {
    const state = service.getSnapshot();
    const products = get(state, "context.products", []);
    return filter(products, product => !isEmpty(product?.error));
  }

  function findProduct(
    mapping: any,
    pending?: boolean
  ): ActorRef<any, any> | undefined {
    const products = pending ? getPendingProducts() : getProducts();
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
    const products = pending ? getPendingProducts() : getProducts();
    return exists(products, mapping, "state.context.model");
  }

  async function addItem({
    // id,
    productId,
    quantity,
    term,
    attributes,
    options,
    provisionFields,
    coupons,
    subproducts,
  }: ProductModel): Promise<ActorRef<any, any>> {
    // lets wait for our basket  to be ready for shopping
    return waitFor(service, state => state.matches("shopping"), {
      timeout: 60_000,
    }).then(async () => {
      // lets add the new product base don the provided config to the basket
      const config = {
        productId,
        quantity,
        term,
        attributes,
        options,
        provisionFields,
        subproducts,
        coupons,
      };

      const mapping = omitBy(
        {
          productId,
          quantity,
          term,
          attributes,
          options,
          provisionFields,
          subproducts,
        },
        isNil
      );

      service.send({
        type: "ADD",
        data: config,
      });

      // then we check if we are still generating the basket ( happens when adding the first item )
      if (service.getSnapshot().matches("generating")) {
        await waitFor(service, state => state.matches("shopping"), {
          timeout: Infinity,
        });
      }

      // then wait/check for the new product actor to be configured
      // then send the update event to the basket
      const items = service.getSnapshot()?.context?.items;
      const actor = (find(items, (basketItem: any) => {
        const found = every(mapping, (value, key) => {
          const origin = get(basketItem, `state.context.model.${key}`);
          const matches = isEqual(origin, value);
          return matches;
        });
        return found;
      }) || last(items)) as ActorRef<any, any>;

      return actor;
    });
  }

  async function updateItem(itemId: string): Promise<ActorRef<any, any>> {
    const basketItem = find(service.getSnapshot()?.context?.items, [
      "id",
      itemId,
    ]);

    if (!basketItem) {
      return Promise.reject({
        message: `Basket item ${itemId} not found`,
        code: responseCodes.Not_Found,
      });
    }
    return waitFor(basketItem, state => {
      return state.matches("available.valid");
    }).then(() =>
      sendToItem(itemId, "UPDATE", { itemId }).then(item => {
        return waitFor(item, state => !state.matches("processing"), {
          timeout: Infinity,
        }).then(state => {
          if (["error", "available.error"].some(state.matches)) {
            return Promise.reject(state.context.error);
          }
          return Promise.resolve(item);
        });
        // .finally(() => service.send({ type: "REFRESH" }));
      })
    );
  }

  async function removeItem(itemId: any): Promise<any> {
    return sendToItem(itemId, "REMOVE", { itemId }).then(item =>
      waitFor(item, state => ["complete"].some(state.matches), {
        timeout: Infinity,
      })
    );
    // .finally(() => service.send({ type: "REFRESH" }));
  }

  // ---------------------------------------------------------------------------
  return {
    service: service.start(),
    getSnapshot: () => service.getSnapshot(),
    getBasketId: () => service.getSnapshot()?.context?.basket?.id,
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
    getPendingProducts,
    getInvalidProducts,
    findProduct,
    productExists,
    findItem: (mapping: any) => findProduct(mapping, true),
    itemExists: (mapping: any) => productExists(mapping, true),
    addItem,
    updateItem,
    removeItem,
  };
};
