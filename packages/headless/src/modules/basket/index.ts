// --- external
import type { ActorRef } from "xstate";
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import basketMachine from "./basket.machine";
export { useBasketProductConfig, useBasketProduct } from "./products";

// --- utils
import {
  every,
  find,
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
import type { ProductModel } from "../product/types";
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
const exists = (items = [], mapping: any, context = null) => {
  // @ts-ignore
  context = context ? `${context}.` : "";
  return some(items, item =>
    every(mapping, (value, key) => {
      const itemValue = get(item, `${context}${key}`, get(item, key));
      const matches = itemValue == value;
      return matches;
    })
  );
};

const sendToItem = async (itemId: any, type: any, data: any) => {
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
};

/**
 * @ignore
 */
export const useBasket = () => {
  return {
    service: service.start(),
    getSnapshot: () => service.getSnapshot(),
    getBasketId: () => service.getSnapshot()?.context?.basket?.id,

    // --- basket functions
    isReady: async () =>
      waitFor(
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
      ),

    clear: () => service.send({ type: "CLEAR" }),

    checkout: () => service.send({ type: "CHECKOUT" }),

    refresh: (data?: any) => {
      service.send({ type: "REFRESH", data });
      return waitFor(service, state =>
        state.matches("shopping.refreshing.processed")
      ).then(() => service.getSnapshot());
    },

    // --- meta functions
    isEmpty: () => {
      const state = service.getSnapshot();
      const pendingProducts = state?.context?.items;
      const products = state?.context?.products;
      const basketId = state?.context?.basket?.id;
      return (
        isEmpty(basketId) || (isEmpty(pendingProducts) && isEmpty(products))
      );
    },

    isAvailable: () => {
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
    },
    needsAuth: () => {
      const state = service.getSnapshot();
      return !state.matches("shopping.account.complete");
    },

    hasProducts: () => {
      const state = service.getSnapshot();
      return !isEmpty(state?.context?.products);
    },

    hasInvalidProducts: () => {
      const state = service.getSnapshot();
      return some(
        state?.context?.products,
        product => !isEmpty(product?.error)
      );
    },

    hasPromotions: () => {
      const state = service.getSnapshot();
      return state.matches("shopping.promotions.complete");
    },

    hasBillingDetails: () => {
      const state = service.getSnapshot();
      return state.matches("shopping.billingDetails.complete");
    },

    hasCurrency: () => {
      const state = service.getSnapshot();
      return state.matches("shopping.currency.complete");
    },

    hasFields: () => {
      const state = service.getSnapshot();
      return state.matches("shopping.customFields.complete");
    },

    hasPaymentDetails: () => {
      const state = service.getSnapshot();
      return ["complete", "available.valid", "available.processing"].some(
        state.matches
      );
    },

    isReadyForCheckout: () => {
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
    },

    isCheckingOut: () => {
      const state = service.getSnapshot();
      const paymentState = state.context?.payment?.getSnapshot();

      return (
        paymentState.matches("approving") ||
        ["approving", "checkout", "converting", "paying"].some(state.matches)
      );
    },

    // --- item functions

    getProducts: () => get(service.getSnapshot(), "context.products", []),
    getPendingProducts: () => get(service.getSnapshot(), "context.items", []),
    getInvalidProducts: () => {
      const state = service.getSnapshot();
      const products = get(state, "context.products", []);
      return filter(products, product => !isEmpty(product?.error));
    },

    findItem: (mapping: any) =>
      find(service.getSnapshot()?.context?.items, (basketItem: any) =>
        every(mapping, (value, key) => {
          if (key == "id") {
            return basketItem.id == value;
          } else {
            return get(basketItem, `state.context.model.${key}`) == value;
          }
        })
      ),

    itemExists: (mapping: any) =>
      exists(
        // @ts-ignore
        service.getSnapshot()?.context?.items,
        mapping,
        // @ts-ignore
        "state.context.model"
      ),

    addItem: async ({
      // id,
      productId,
      quantity,
      term,
      attributes,
      options,
      provisionFields,
      coupons,
      subproducts,
    }: ProductModel) => {
      // lets wait for our basket  to be ready for shopping
      return waitFor(service, state => state.matches("shopping")).then(() => {
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
    },

    // --- Item CRUD

    updateItem: async (itemId: string): Promise<ActorRef<any, any>> => {
      return sendToItem(itemId, "UPDATE", { itemId }).then(item => {
        return waitFor(item, state => !state.matches("processing"), {
          timeout: Infinity,
        }).then(state => {
          if (["error", "available.error"].some(state.matches)) {
            return Promise.reject(state.context.error);
          }
          return Promise.resolve(item);
        });
        // .finally(() => service.send({ type: "REFRESH" }));
      });
    },

    removeItem: async (itemId: any): Promise<any> => {
      return sendToItem(itemId, "REMOVE", { itemId }).then(item =>
        waitFor(item, state => ["complete"].some(state.matches), {
          timeout: Infinity,
        })
      );
      // .finally(() => service.send({ type: "REFRESH" }));
    },
  };
};
