// --- external
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import productMachine from "../product/product.machine";
import { useBasket } from "../basket";
import { useProductConfig } from "../product";

// --- utils
import { getBasketProduct } from "./utils";
import { parseQuantity } from "../product/utils";
import { DetailedError, responseCodes, stopService } from "../../utils";
import { isEmpty, get, add, subtract } from "lodash-es";

// --- types
import type { InterpreterFrom } from "xstate";
import type { Product } from "../product";
// -----------------------------------------------------------------------------

export const useBasketProduct = (bpid: string) => {
  const { basket: rawBasket, errors } = useBasket();
  if (!rawBasket.value)
    throw new DetailedError("No Basket found", responseCodes.Not_Found);

  let rawBasketProduct = getBasketProduct(bpid, rawBasket.value);

  if (isEmpty(rawBasketProduct))
    throw new DetailedError("No Basket Product found", responseCodes.Not_Found);

  let service = interpret(
    productMachine.withContext({
      id: bpid,
      basketId: rawBasket.value.id,
      clientId: rawBasket.value.client_id,
      currencyId: rawBasket.value.currency_id,
      promotions: rawBasket.value.promotions,
      coupons: [],
      // ---
      rawBasketProduct,
      errorExternal: get(errors.value, bpid)
    }),
    {
      id: bpid,
      devTools: true
    }
  ).start();

  // ---------------------------------------------------------------------------

  async function isReady(): Promise<void> {
    return waitFor(service, state => state.matches("available"), {
      timeout: Infinity
    }).then(() => {});
  }

  async function getProduct(): Promise<Product> {
    return new Promise<Product>((resolve, reject) => {
      const product = get(service.getSnapshot(), "context.product") as Product;
      if (!product)
        return reject(
          new DetailedError("Product not found", responseCodes.Not_Found)
        );
      return resolve(product);
    });
  }

  async function update(): Promise<void> {
    service.send({ type: "UPDATE" });
    return waitFor(service, state => !state.matches("processing"), {
      timeout: 60_000
    })
      .then(state => {
        if (
          ["error", "available.invalid", "available.error"].some(state.matches)
        ) {
          return Promise.reject(state.context.error);
        }
        return Promise.resolve();
      })
      .catch(() => {
        return Promise.reject(
          new Error(
            "[headless] update in useBasketProductPending not in a valid state"
          )
        );
      });
  }

  // ---------------------------------------------------------------------------
  return {
    ...useProductConfig(service),
    id: bpid,
    isReady,
    stop: () => stopService(service as InterpreterFrom<any>),
    // ---
    updateQuantity: async (value: number): Promise<void> =>
      getProduct().then(product => {
        if (!product?.productDetails.quantifiable)
          return Promise.reject(
            new DetailedError(
              "Product not quantifiable",
              responseCodes.Unprocessable_Entity
            )
          );

        service.send({
          type: "SET.QUANTITY",
          data: {
            quantity: parseQuantity(value, product.productDetails)
          }
        });
        return update();
      }),

    incrementQuantity: async (): Promise<void> =>
      getProduct().then(product => {
        if (!product?.productDetails.quantifiable)
          return Promise.reject(
            new DetailedError(
              "Product not quantifiable",
              responseCodes.Unprocessable_Entity
            )
          );

        const qty = add(
          get(product.configuration, "quantity", 1),
          product.productDetails.step
        );
        service.send({
          type: "SET.QUANTITY",
          data: {
            quantity: parseQuantity(qty, product.productDetails)
          }
        });
        return update();
      }),

    decrementQuantity: async (): Promise<void> =>
      getProduct().then(product => {
        if (!product?.productDetails.quantifiable)
          return Promise.reject(
            new DetailedError(
              "Product not quantifiable",
              responseCodes.Unprocessable_Entity
            )
          );

        const qty = subtract(
          get(product.configuration, "quantity", 1),
          product.productDetails.step
        );
        service.send({
          type: "SET.QUANTITY",
          data: {
            quantity: parseQuantity(qty, product.productDetails)
          }
        });
        return update();
      }),

    update
  };
};

export type UseBasketProduct = ReturnType<typeof useBasketProduct>;
