// --- external
import { interpret, InterpreterStatus } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import productMachine from "../product/product.machine";
import { useBasket } from "../basket";
import { useDataLayer } from "../system";
const { dataLayer } = useDataLayer();

// --- utils
import { parseQuantity } from "../product/utils";
import { DetailedError, responseCodes, stopService } from "../../utils";
import { isEmpty, get, add, subtract, find, omit, isNil } from "lodash-es";
import { isActor } from "xstate/lib/utils";

// --- types
import type { InterpreterFrom, ActorRef } from "xstate";
import type { Product, ProductModel, ProductProps } from "../product";
import { isFunction } from "xstate/lib/utils";
// import { DataLayerEcommerceItem } from "../system/analytics/types";

// -----------------------------------------------------------------------------

export const useBasketProductPending = (data: ProductProps | ActorRef<any>) => {
  function isProductProps(
    value: ProductProps | ActorRef<any>
  ): value is ProductProps {
    return value && typeof value === "object" && "productId" in value;
  }

  const actor: ActorRef<any> | undefined = isActor(data)
    ? (data as ActorRef<any>)
    : undefined;

  const model: ProductProps | undefined = isProductProps(data)
    ? (omit(data, [
        "currencyId",
        "clientId",
        "promotions",
        "coupons",
        "subproducts",
      ]) as ProductModel)
    : undefined;

  const coupons = isProductProps(data) ? (data?.coupons ?? []) : [];
  const subproducts = isProductProps(data) ? (data?.subproducts ?? []) : [];

  const { getBasket } = useBasket();
  const rawBasket = getBasket();
  if (!rawBasket)
    throw new DetailedError("No Basket found", responseCodes.Not_Found);

  if (isEmpty(data) || (isEmpty(actor) && isEmpty(model?.productId)))
    throw new DetailedError(
      "Product Model is empty or has no productId",
      responseCodes.Not_Found
    );

  const id = actor?.id || btoa(JSON.stringify(data)); // use the model as the basis for the id

  let service =
    actor ||
    interpret(
      productMachine.withContext({
        id,
        basketId: rawBasket.id,
        clientId: rawBasket.client_id,
        currencyId: rawBasket.currency_id,
        promotions: rawBasket.promotions,
        subproducts,
        coupons,
        // ---
        model,
      }),
      {
        id,
        devTools: true,
      }
    ).start();

  // now that we have a product configation, we can push it to the datalayer
  pushSelectItem();

  // ---------------------------------------------------------------------------

  async function isReady(): Promise<void> {
    return waitFor(service, state => state.matches("available"), {
      timeout: Infinity, // infinity = no timeout
    }).then(() => {});
  }

  // refresh: async (newBasket: IBasket) => {
  //   service.send({ type: "REFRESH", rawBasket });
  //   return waitFor(service, state => state.matches("available"));
  // },

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

  // Add our Pending Product being configured to the datalayer
  async function pushSelectItem() {
    await isReady(); // NB wait for everything to finish loading
    const product = getProduct()
      .then(product => {
        dataLayer({ event: "select_item" }).withItems(product).push();
      })
      .catch(() => {
        /* do nothing*/
      });
  }

  // ---------------------------------------------------------------------------
  return {
    id,
    service,
    getSnapshot: () => service?.getSnapshot(),
    getProduct: () => service.getSnapshot().context.product,
    getModel: () => service.getSnapshot().context.model,
    stop: () => stopService(service as InterpreterFrom<any>),
    // ---
    isReady,
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
            quantity: parseQuantity(value, product.productDetails),
          },
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
            quantity: parseQuantity(qty, product.productDetails),
          },
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
            quantity: parseQuantity(qty, product.productDetails),
          },
        });
        return update();
      }),

    update,
    remove,
  };
};
