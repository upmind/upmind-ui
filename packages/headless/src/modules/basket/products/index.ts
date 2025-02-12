// --- external
import type { ActorRef } from "xstate";
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import productMachine from "../../product/product.machine";
import services from "./services";
// --- utils
import { find } from "lodash-es";

import { responseCodes } from "../../api";

// --- types
import type { IBasket, IBasketProduct } from "@upmind-automation/types";
import type { BasketProduct } from "../types";
import { parseBasketProduct } from "../utils";
import { DetailedError } from "../../../utils";

// --------------------------------------------------------
// create a global instance of the basket machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

export const useBasketProduct = (
  id: string,
  rawBasket: IBasket,
  errorExternal?: any
) => {
  function getBasketProduct(basket: IBasket) {
    const value = find(basket?.products, { id });
    if (!value) {
      throw new DetailedError(
        "Product not found in basket",
        responseCodes.Not_Found
      );
    }

    return value;
  }

  let basketProduct = getBasketProduct(rawBasket);

  return {
    basketProduct: parseBasketProduct(basketProduct, errorExternal),
    refresh: async (newBasket: IBasket) => {
      basketProduct = getBasketProduct(newBasket);
    },
    update: async (data: BasketProduct): Promise<ActorRef<any>> => {
      return services.update({ basketId: rawBasket.id }, { data });
    },

    remove: async (): Promise<any> => {
      return services.remove({ basketId: rawBasket.id, bpid: id });
    },
  };
};

export const useBasketProductConfig = (
  id: string,
  rawBasket: IBasket,
  errorExternal?: any
) => {
  const basketProduct = find(rawBasket?.products, { id });

  if (!basketProduct) {
    throw new DetailedError(
      "Product not found in basket",
      responseCodes.Not_Found
    );
  }

  const service = interpret(
    productMachine.withContext({
      id,
      basketId: rawBasket.id,
      basketProduct,
      currencyId: rawBasket.currency_id,
      promotions: rawBasket.promotions,
      clientId: rawBasket.client_id,
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

    refresh: (basket: IBasket) => {
      service.send({ type: "REFRESH", basket });
      return waitFor(service, state => state.matches("available"));
    },

    stop: () => service.stop(),

    update: async (): Promise<ActorRef<any>> => {
      service.send({ type: "UPDATE" });

      return waitFor(service, state => !state.matches("processing")).then(
        state => {
          if (["error", "available.error"].some(state.matches)) {
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
