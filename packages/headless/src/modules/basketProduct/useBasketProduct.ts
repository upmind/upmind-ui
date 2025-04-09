// --- external
import { interpret, InterpreterStatus } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import productMachine from "../product/product.machine";
import { useBasket } from "../basket";

// --- utils
import { getBasketProduct } from "./utils";
import { parseQuantity } from "../product/utils";
import { DetailedError, responseCodes } from "../../utils";
import { isEmpty, get, add, subtract } from "lodash-es";

// --- types
import type { Product } from "../product";
// -----------------------------------------------------------------------------

export const useBasketProduct = (bpid: string) => {
  const { getBasket, getErrors } = useBasket();
  const rawBasket = getBasket();
  if (!rawBasket)
    throw new DetailedError("No Basket found", responseCodes.Not_Found);

  let rawBasketProduct = getBasketProduct(bpid, rawBasket);
  let provisioningErrors = get(getErrors(), "provisioningErrors");

  if (isEmpty(rawBasketProduct))
    throw new DetailedError("No Basket Product found", responseCodes.Not_Found);

  let service = interpret(
    productMachine.withContext({
      id: bpid,
      basketId: rawBasket.id,
      clientId: rawBasket.client_id,
      currencyId: rawBasket.currency_id,
      promotions: rawBasket.promotions,
      coupons: [],
      // ---
      basketProduct: rawBasketProduct,
      errorExternal: get(provisioningErrors, [bpid]),
    }),
    {
      id: bpid,
      devTools: true,
    }
  ).start();

  // ---------------------------------------------------------------------------

  // refresh: async (newBasket: IBasket) => {
  //   service.send({ type: "REFRESH", rawBasket });
  //   return waitFor(service, state => state.matches("available"));
  // },

  async function getProductDetails(): Promise<Product> {
    return new Promise<Product>((resolve, reject) => {
      const product = get(service.getSnapshot(), "context.lookup.product") as
        | Product
        | undefined;
      // sanity check
      if (!product) return reject("Product not found");
      // ---
      return resolve(product);
    });
  }

  async function update(): Promise<void> {
    return waitFor(service, state => state.matches("available.valid")).then(
      () => {
        service.send({ type: "UPDATE" });
        return waitFor(service, state => !state.matches("processing"), {
          timeout: Infinity,
        }).then(state => {
          if (["error", "available.error"].some(state.matches)) {
            return Promise.reject(state.context.error);
          }
          return Promise.resolve();
        });
      }
    );
  }

  async function remove(): Promise<void> {
    service.send({ type: "REMOVE" });
    await waitFor(service, state => ["complete"].some(state.matches), {
      timeout: Infinity,
    });
  }

  // ---------------------------------------------------------------------------
  return {
    id: bpid,
    service,
    getSnapshot: () => service?.getSnapshot(),
    stop: () => service.status == InterpreterStatus.Running && service.stop(),
    // ---
    isReady: async () => {
      return waitFor(service, state => state.matches("available"), {
        timeout: Infinity, // infinity = no timeout
      });
    },
    // ---
    updateQuantity: async (value: number): Promise<void> =>
      getProductDetails().then(product => {
        if (!product?.quantifiable)
          return Promise.reject("Product not quantifiable");
        service.send({
          type: "SET.QUANTITY",
          data: {
            quantity: parseQuantity(value, product),
          },
        });
        return update();
      }),

    incrementQuantity: async (): Promise<void> =>
      getProductDetails().then(product => {
        const model = get(service.getSnapshot(), "context.model");
        const qty = add(get(model, "quantity", 1), product.step);
        service.send({
          type: "SET.QUANTITY",
          data: {
            quantity: parseQuantity(qty, product),
          },
        });
        return update();
      }),

    decrementQuantity: async (): Promise<void> =>
      getProductDetails().then(product => {
        const model = get(service.getSnapshot(), "context.model");
        const qty = subtract(get(model, "quantity", 1), product.step);
        service.send({
          type: "SET.QUANTITY",
          data: {
            quantity: parseQuantity(qty, product),
          },
        });
        return update();
      }),

    update,
    remove,
  };
};
