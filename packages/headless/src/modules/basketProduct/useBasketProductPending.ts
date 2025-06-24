// --- external
import { interpret } from "xstate";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import productMachine from "../product/product.machine";
import { useBasket } from "../basket";
import { useDataLayer } from "../system";
import { useProductConfig } from "../product";
const { dataLayer } = useDataLayer();

// --- utils
import { isActor } from "xstate/lib/utils";
import { parseQuantity } from "../product/utils";
import { isEmpty, get, omit, add, subtract } from "lodash-es";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  stopService,
  useContext,
} from "../../utils";

// --- types
import type { ActorRef, InterpreterFrom } from "xstate";
import type { Product, ProductModel, ProductProps } from "../product";

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

  const productProps: ProductProps | undefined = isProductProps(data)
    ? (omit(data, [
        "currencyId",
        "clientId",
        "promotions",
        "coupons",
        "subproducts",
        "silent",
        "bundle",
      ]) as ProductModel)
    : undefined;

  const coupons = isProductProps(data) ? (data?.coupons ?? []) : [];
  const subproducts = isProductProps(data) ? (data?.subproducts ?? []) : [];
  const silent = isProductProps(data) ? (data?.silent ?? false) : false;
  const bundle = isProductProps(data) ? data?.bundle : undefined;
  const { basket: rawBasket } = useBasket();
  if (!rawBasket.value)
    throw new DetailedError(
      "[headless] getBasket on useBasketProductPending not found",
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );

  if (isEmpty(data) || (isEmpty(actor) && isEmpty(productProps?.productId)))
    throw new DetailedError(
      "[headless] getProduct on useBasketProductPending not found",
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );

  const id = actor?.id || btoa(JSON.stringify(data)); // use the model as the basis for the id

  const service: ActorRef<any> =
    actor ||
    interpret(
      productMachine.withContext({
        id,
        basketId: rawBasket.value.id,
        clientId: rawBasket.value.client_id,
        currencyId: rawBasket.value.currency_id,
        promotions: rawBasket.value.promotions,
        subproducts,
        coupons,
        silent,
        bundle,
        // ---
        model: productProps,
      }),
      {
        id,
        devTools: true,
      }
    ).start();

  const { state, send } = useActor(service);

  // now that we have a product configuration, we can push it to the datalayer
  pushSelectItem();

  // ---------------------------------------------------------------------------

  async function isReady(): Promise<void> {
    return waitFor(service, state => state.matches("available"), {
      timeout: Infinity,
    }).then(() => {});
  }

  // refresh: async (newBasket: IBasket) => {
  //   service.send({ type: "REFRESH", rawBasket });
  //   return waitFor(service, state => state.matches("available"));
  // },

  // --- context

  const model = useContext<ProductModel>(state, "model", {});
  const product = useContext<Product>(state, "product", {});
  // --- methods

  async function getProduct(): Promise<Product> {
    return new Promise<Product>((resolve, reject) => {
      const product = get(service.getSnapshot(), "context.product") as Product;
      if (!product)
        return reject(
          new DetailedError(
            "[headless] Product not found",
            responseCodes.Not_Found,
            ErrorOrigin.Headless
          )
        );
      return resolve(product);
    });
  }

  async function update(): Promise<void> {
    service.send({ type: "UPDATE" });
    return waitFor(
      service,
      state =>
        !state.matches("processing", {
          timeout: 60_000,
        }),
      {}
    )
      .then(state => {
        if (
          ["error", "available.invalid", "available.error"].some(state.matches)
        ) {
          return Promise.reject(
            new DetailedError(
              "[headless] update in useBasketProductPending failed",
              responseCodes.Unprocessable_Entity,
              ErrorOrigin.Headless,
              state.context.error
            )
          );
        }
        return Promise.resolve();
      })
      .catch(() => {
        return Promise.reject(
          new DetailedError(
            "[headless] update in useBasketProductPending not in a valid state",
            responseCodes.Unprocessable_Entity,
            ErrorOrigin.Headless
          )
        );
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
    ...useProductConfig(service),
    id,
    product,
    model,
    stop: () => stopService(service as InterpreterFrom<any>),
    // ---
    isReady,
    // ---
    updateQuantity: async (value: number): Promise<void> =>
      getProduct().then(product => {
        if (!product?.productDetails.quantifiable)
          return Promise.reject(
            new DetailedError(
              "[headless] Product not quantifiable",
              responseCodes.Unprocessable_Entity,
              ErrorOrigin.Headless
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
              responseCodes.Unprocessable_Entity,
              ErrorOrigin.Headless
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
              responseCodes.Unprocessable_Entity,
              ErrorOrigin.Headless
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
  };
};

type UsePendingProduct = ReturnType<typeof useBasketProductPending>;
