import { useActor } from "@xstate/vue";
import { interpret } from "xstate";
import { isActor } from "xstate/lib/utils";
import { waitFor } from "xstate/lib/waitFor";
import { useBasket, useBasketCurrency } from "../basket";
import { useProductConfig } from "../product";
import { productMachine } from "../product";
import { parseQuantity } from "../product/product.utils";
import { useDataLayer } from "../system-analytics";
import { useI18n } from "../system-localisation";
import {
  contextValue,
  DetailedError,
  ErrorOrigin,
  responseCodes,
  stateMatches,
  stopService,
  useContext
} from "../../utils";
import { isEmpty, get, omit, add, subtract, isObject, has } from "lodash-es";
import type { Product, ProductModel, ProductProps } from "../product";
import type { ActorRef } from "xstate";

// -----------------------------------------------------------------------------

/**
 * Composable for managing the state of a product that is pending addition to the basket.
 * This composable is designed to handle the configuration, validation, and eventual addition
 * of a product to the shopping basket.
 * It leverages an internal XState machine to manage the product's lifecycle.
 *
 * @param data - Either a {@link ProductProps} object directly containing product configuration,
 *               or an {@link ActorRef} to an existing XState machine instance for the product.
 * @returns The {@link UsePendingProduct} API for managing the product's state.
 * @throws {DetailedError} If the basket is not available, or if the provided product data is invalid or missing.
 */
export const useBasketProductPending = (data: ProductProps | ActorRef<any>) => {
  const { t } = useI18n();

  /**
   * Type guard to check if the input `value` is a {@link ProductProps} object.
   * @param value - The value to check.
   * @returns `true` if the value is a `ProductProps` object, `false` otherwise.
   */
  function isProductProps(
    value: ProductProps | ActorRef<any>
  ): value is ProductProps {
    return value && isObject(value) && has(value, "productId");
  }

  const { basket: rawBasket } = useBasket();

  const actor: ActorRef<any> | undefined = isActor(data)
    ? (data as ActorRef<any>)
    : undefined;

  const productModel: ProductModel | undefined = isProductProps(data)
    ? (omit(data, [
        "currencyId",
        "currencyCode",
        "clientId",
        "promotions",
        "coupons",
        "subproducts",
        "silent",
        "bundle"
      ]) as ProductModel)
    : undefined;

  if (isEmpty(data) || (isEmpty(actor) && isEmpty(productModel?.productId)))
    throw new DetailedError(
      t("error.product_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );

  const currencyId =
    isProductProps(data) && data.currencyId ? data.currencyId : undefined;
  const currencyCode = isProductProps(data) ? data.currencyCode : undefined;
  const coupons = isProductProps(data) ? (data?.coupons ?? []) : [];
  const subproducts = isProductProps(data) ? (data?.subproducts ?? []) : [];
  const silent = isProductProps(data) ? (data?.silent ?? false) : false;
  const bundle = isProductProps(data) ? data?.bundle : undefined;

  const id = actor?.id || btoa(JSON.stringify(data)); // use the model as the basis for the id

  const service: ActorRef<any> =
    actor ||
    interpret(
      productMachine.withContext({
        id,
        basketId: rawBasket.value?.id,
        clientId: rawBasket.value?.client_id,
        currencyId: currencyId ?? rawBasket.value?.currency_id,
        currencyCode,
        promotions: rawBasket.value?.promotions,
        subproducts,
        coupons,
        silent,
        bundle,
        // ---
        model: productModel
      }),
      {
        id,
        devTools: true
      }
    ).start();

  const { state } = useActor(service);

  // now that we have a product configuration, we can push it to the datalayer
  pushSelectItem();

  // ---------------------------------------------------------------------------

  /**
   * Waits for the product service to reach an 'available' state, indicating it's ready for interaction.
   * This is typically used to ensure the product's configuration and initial data have loaded.
   *
   * @returns A promise that resolves when the product service is ready.
   */
  async function isReady(): Promise<void> {
    const { isReady: currencyIsReady } = useBasketCurrency();
    return currencyIsReady().then(() =>
      waitFor(
        service,
        state => stateMatches(state, ["available", "complete", "done"]),
        { timeout: Infinity }
      )
    );
  }

  // --- context

  const model = useContext<ProductModel>(state, "model", {});
  const product = useContext<Product>(state, "product", {});

  // --- methods

  /**
   * Retrieves the detailed product information after ensuring the product service is ready.
   *
   * @returns A promise that resolves with the {@link Product} details.
   * @throws {DetailedError} If the product details cannot be retrieved or are unavailable.
   */
  async function getProduct(): Promise<Product> {
    return new Promise<Product>((resolve, reject) => {
      const product = contextValue<Product>(service, "product");
      if (!product) {
        return reject(
          new DetailedError(
            t("error.product_not_available"),
            responseCodes.Not_Found,
            ErrorOrigin.Headless
          )
        );
      }
      return resolve(product);
    });
  }

  /**
   * Leaves this product's add to the backend, for flows that add without the
   * shopper configuring anything.
   */
  async function silence(): Promise<void> {
    service.send({ type: "SILENT", data: true });
  }

  /**
   * Updates the product's configuration based on current selections or changes.
   * It sends an 'UPDATE' event to the service and waits for the operation to complete or error.
   *
   * @returns A promise that resolves upon successful update, or rejects if the update fails or times out.
   */
  async function update(): Promise<void> {
    service.send({ type: "UPDATE" });
    return waitFor(
      service,
      state =>
        stateMatches(state, [
          "unavailable",
          "available.invalid",
          "available.error",
          "complete",
          "done"
        ]),
      { timeout: 60_000 }
    )
      .then(state => {
        if (
          stateMatches(state, [
            "unavailable",
            "available.invalid",
            "available.error"
          ])
        ) {
          throw state.context.error;
        }
      })
      .catch(error => {
        return Promise.reject(
          new DetailedError(
            error?.message ??
              t("error.basket_product_pending_validation_failed"),
            error?.code ?? responseCodes.Unprocessable_Entity,
            error?.origin ?? ErrorOrigin.Headless
          )
        );
      });
  }

  /**
   * Pushes the `select_item` event to the `dataLayer` with the current product's information.
   * This is called automatically after the product service is ready to track product selections for analytics.
   *
   * @returns A promise that resolves when the product details are fetched and pushed, or rejects silently if fetching fails.
   */
  async function pushSelectItem() {
    await isReady(); // NB wait for everything to finish loading
    getProduct()
      .then(product => {
        useDataLayer()
          .dataLayer({ event: "select_item" })
          .withItems(product)
          .push();
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
    coupons,
    stop: () => stopService(service),
    // ---
    isReady,
    // ---

    /**
     * Updates the quantity of the product.
     * Ensures the product is quantifiable before attempting to update.
     *
     * @param value - The new quantity value.
     * @returns A promise that resolves when the quantity is updated.
     * @throws {DetailedError} If the product is not quantifiable or the update fails.
     */
    updateQuantity: async (value: number): Promise<void> =>
      getProduct().then(product => {
        if (!product?.productDetails.quantifiable)
          return Promise.reject(
            new DetailedError(
              t("error.product_quantifiable_not_available"),
              responseCodes.Unprocessable_Entity,
              ErrorOrigin.Headless
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

    /**
     * Increments the product quantity by its defined step.
     * Ensures the product is quantifiable before incrementing.
     *
     * @returns A promise that resolves when the quantity is incremented.
     * @throws {DetailedError} If the product is not quantifiable or the update fails.
     */
    incrementQuantity: async (): Promise<void> =>
      getProduct().then(product => {
        if (!product?.productDetails.quantifiable)
          return Promise.reject(
            new DetailedError(
              t("error.product_quantifiable_not_available"),
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
            quantity: parseQuantity(qty, product.productDetails)
          }
        });
        return update();
      }),

    /**
     * Decrements the product quantity by its defined step.
     * Ensures the product is quantifiable before decrementing.
     *
     * @returns A promise that resolves when the quantity is decremented.
     * @throws {DetailedError} If the product is not quantifiable or the update fails.
     */
    decrementQuantity: async (): Promise<void> =>
      getProduct().then(product => {
        if (!product?.productDetails.quantifiable)
          return Promise.reject(
            new DetailedError(
              t("error.product_quantifiable_not_available"),
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
            quantity: parseQuantity(qty, product.productDetails)
          }
        });
        return update();
      }),

    /**
     * Manually triggers an update to the product's configuration in the basket.
     * This is often called after quantity changes or other modifications.
     *
     * @returns A promise that resolves upon successful update, or rejects on error.
     */
    update,

    /**
     * Leaves this product's add to the backend, for flows that add without the
     * shopper configuring anything.
     */
    silence
  };
};

/**
 * Type definition for the return value of the `useBasketProductPending` composable,
 * ensuring type safety for consumers.
 */
export type UsePendingProduct = ReturnType<typeof useBasketProductPending>;
