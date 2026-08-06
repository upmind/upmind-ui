// --- external
import { computed } from "vue";
import { waitFor } from "xstate/lib/waitFor";
import { interpret } from "xstate";

// --- internal
import { useI18n } from "../system";
import { useBasket } from "../basket";
import productMachine from "../product/product.machine";
import { useProductConfig } from "../product";

// --- utils
import { getBasketProduct } from "./utils";
import { parseQuantity } from "../product/utils";
import {
  contextValue,
  DEBOUNCE_DELAY,
  DetailedError,
  ErrorOrigin,
  responseCodes,
  stateMatches,
  stopService
} from "../../utils";
import { isEmpty, get, add, subtract, debounce } from "lodash-es";

// --- types
import type { Product } from "../product";
// -----------------------------------------------------------------------------

/**
 * Provides utility functions and state management for interacting with a specific product in the shopping basket.
 *
 * This function leverages several internal hooks and services to facilitate product-related operations
 * such as quantity management, readiness checks, and error handling. It initialises and returns methods
 * that allow interaction with the basket product through a state machine.
 */
export const useBasketProduct = (
  bpid: string,
  options?: { allowMultipleEdits?: boolean; silent?: boolean }
) => {
  const { t } = useI18n();
  const { basket: rawBasket, errors } = useBasket();

  if (!rawBasket.value)
    throw new DetailedError(
      t("error.basket_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );

  let rawBasketProduct = getBasketProduct(bpid, rawBasket.value);

  if (isEmpty(rawBasketProduct))
    throw new DetailedError(
      t("error.basket_product_not_found"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );

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
      basketErrors: errors.value,
      allowMultipleEdits: options?.allowMultipleEdits,
      silent: options?.silent
    }),
    {
      id: bpid,
      devTools: true
    }
  ).start();

  // ---------------------------------------------------------------------------

  async function isReady(): Promise<boolean> {
    // Wait for a post-validation leaf state. Resolving on the parent
    // `available` is too early — validation only runs inside
    // `available.checking.validating`, so `basketErrors` (and therefore
    // `invalidSchema`) is empty until we land on `available.valid` or
    // `available.invalid`. Callers depending on those would race the machine.
    return waitFor(
      service,
      state =>
        stateMatches(state, [
          "available.valid",
          "available.invalid",
          "available.error",
          "unavailable",
          "done"
        ]),
      { timeout: Infinity }
    ).then(state => {
      return stateMatches(state, ["available"]);
    });
  }

  async function getProduct(): Promise<Product> {
    return new Promise<Product>((resolve, reject) => {
      const product = contextValue<Product>(service, "product");
      if (!product)
        return reject(
          new DetailedError(
            t("error.product_not_available"),
            responseCodes.Not_Found,
            ErrorOrigin.Headless
          )
        );
      return resolve(product);
    });
  }

  async function update(): Promise<void> {
    service.send({ type: "UPDATE" });
    return waitFor(service, state => !stateMatches(state, "processing"), {
      timeout: 60_000
    })
      .then(state => {
        if (
          stateMatches(state, [
            "unavailable",
            "available.invalid",
            "available.error"
          ])
        ) {
          return Promise.reject(
            new DetailedError(
              t("error.basket_product_update_failed"),
              responseCodes.Unprocessable_Entity,
              ErrorOrigin.Headless,
              state.context.error
            )
          );
        }
        return Promise.resolve();
      })
      .catch(error => {
        return Promise.reject(
          new DetailedError(
            t("error.basket_product_pending_update_failed"),
            responseCodes.Unprocessable_Entity,
            ErrorOrigin.Headless
          )
        );
      });
  }

  // --- methods

  /** @deprecated Use useProductConfig.updateQuantity via inline composable. */
  const updateQuantity = debounce(
    async (value: number): Promise<void> =>
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
    DEBOUNCE_DELAY
  );

  /** @deprecated Use useProductConfig.incrementQuantity via inline composable. */
  const incrementQuantity = debounce(
    async (): Promise<void> =>
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
    DEBOUNCE_DELAY
  );

  /** @deprecated Use useProductConfig.decrementQuantity via inline composable. */
  const decrementQuantity = debounce(
    async (): Promise<void> =>
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
    DEBOUNCE_DELAY
  );

  // ---------------------------------------------------------------------------
  return {
    ...useProductConfig(service),
    id: computed(() => bpid),
    isReady,
    stop: () => stopService(service),
    // ---
    // updateQuantity,
    // incrementQuantity,
    // decrementQuantity,
    update
  };
};

/**
 * Represents the type definition for the return value of the `useBasketProduct` function.
 *
 * This is a utility type that references the return type of the `useBasketProduct` function.
 * It encapsulates the structure and expected properties returned by that function, ensuring
 * type safety and consistency when using its output throughout the codebase.
 */
export type UseBasketProduct = ReturnType<typeof useBasketProduct>;
