// --- external
import type { ActorRef } from "xstate";
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import productMachine from "../../product/product.machine";

// --- utils
import { find } from "lodash-es";

import { responseCodes } from "../../api";

// --- types
import type { Basket } from "../types";

// --------------------------------------------------------
// create a global instance of the basket machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

/**
 * @ignore
 */
export const useBasketProduct = (
  id: string,
  rawBasket: Basket,
  errorExternal?: any
) => {
  const basketProduct = find(rawBasket?.products, { id });
  if (!basketProduct) {
    const error = new Error("Product not found in basket");
    //@ts-ignore
    error.code = responseCodes.Not_Found;
    throw error;
  }

  const service = interpret(
    productMachine.withContext({
      id,
      basketId: rawBasket.id,
      basketProduct,
      currencyId: rawBasket.currency_id,
      promotions: rawBasket.promotions,
      errorExternal,
    }),
    {
      devTools: true,
    }
  );

  return {
    service: service.start(),
    getSnapshot: () => service.getSnapshot(),

    // --- basket functions
    isReady: async () =>
      waitFor(service, state => state.matches("available"), {
        timeout: Infinity, // infinity = no timeout
      }),

    refresh: (basket: Basket) => {
      service.send({ type: "REFRESH", basket });
      return waitFor(service, state => state.matches("available"));
    },

    stop: () => service.stop(),

    update: async (): Promise<ActorRef<any, any>> => {
      service.send({ type: "UPDATE" });

      return waitFor(service, state => !state.matches("processing")).then(
        state => {
          if (["error", "available.error"].some(state.matches)) {
            // @ts-ignore
            return Promise.reject(state?.context?.error);
          }
          return Promise.resolve(service);
        }
      );
    },

    remove: async (): Promise<any> => {
      service.send({ type: "REMOVE" });
      return waitFor(service, state => ["complete"].some(state.matches));
    },
  };
};
