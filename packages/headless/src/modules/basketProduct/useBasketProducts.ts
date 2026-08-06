// --- external
import { computed, ref, watch } from "vue";

// --- internal
import { useBasket } from "../basket";
import services from "./services";
import { useI18n } from "../system";

// --- utils
import { get, add, subtract, has, set, unset } from "lodash-es";
import {
  DetailedError,
  ErrorOrigin,
  isStoppedService,
  responseCodes,
  stopService
} from "../../utils";

// --- types
import type { BasketProduct } from "./types";
import { type ProductModel } from "../product";
import { type IBasket } from "@upmind-automation/types";

import { type UseBasketProduct, useBasketProduct } from "./useBasketProduct";

// --- utils
import { isEmpty, debounce, forEach, some, remove as _remove } from "lodash-es";
import { DEBOUNCE_DELAY } from "../../utils";
// -----------------------------------------------------------------------------

// --- state
const processing = ref<Record<string, boolean>>({});

// --- config registry: singleton — reuse existing product config composables by bpid
const configRegistry: Record<string, UseBasketProduct> = {};

// -----------------------------------------------------------------------------

/**
 * Provides a composable interface for managing products within the shopping basket.
 * It leverages the {@link useBasket} composable for core basket state and actions,
 * and exposes methods for interacting with individual basket products, such as
 * retrieving, removing, updating quantity, and resolving product configurations.
 *
 * @returns The API for managing basket products.
 */
export const useBasketProducts = () => {
  const {
    findProduct,
    findProducts,
    productExists,
    isReady,
    refresh,
    products,
    basketId,
    meta: basketMeta
  } = useBasket();
  const { t } = useI18n();

  // --- housekeeping: prune config machines for products no longer in the basket
  watch(products, currentProducts => {
    forEach(configRegistry, (config, bpid) => {
      if (!some(currentProducts, ["id", bpid])) {
        config.stop();
        unset(configRegistry, bpid);
      }
    });
  });

  // --- methods

  /**
   * Retrieves a specific {@link BasketProduct} from the basket by its ID, after ensuring the basket is ready.
   *
   * @param id - The unique identifier of the basket product.
   * @returns A promise resolving to the found {@link BasketProduct} or `undefined` if not found.
   */
  async function getBasketProduct(
    id: string
  ): Promise<BasketProduct | undefined> {
    return isReady().then(() => findProduct({ id }));
  }

  /**
   * Removes a product from the basket by its ID.
   * This operation is debounced to prevent rapid multiple calls.
   * It also updates the dataLayer and refreshes the basket.
   *
   * @param id - The unique identifier of the basket product to remove.
   * @returns A promise resolving to the updated {@link IBasket} or `undefined` if the basket is not available.
   * @throws {DetailedError} If the basket is not available or the product is not found.
   */
  async function remove(id: string) {
    if (!basketId.value) {
      throw new DetailedError(
        t("error.basket_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      );
    }

    // DataLayer and prefresh are handled in services.ts
    return services.remove(basketId.value, id);
  }

  /**
   * Resolves a product's configuration by updating it in the basket.
   * This is used when a user finalizes configuration changes for a product.
   * It handles data updates, basket refresh, and pushes 'add_to_cart' event to dataLayer.
   *
   * @param id - The unique identifier of the basket product.
   * @param data - The {@link ProductModel} containing the updated configuration.
   * @returns A promise resolving to the updated {@link IBasket} or `undefined` if the basket is not available.
   * @throws {DetailedError} If the basket is not available, the product is not found, or an error occurs during update.
   */
  async function resolve(
    id: string,
    data: ProductModel
  ): Promise<IBasket | undefined> {
    if (!basketId.value) {
      throw new DetailedError(
        t("error.basket_not_available"),
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      );
    }

    // DataLayer and prefresh are handled in services.ts
    return services.update(basketId.value, { ...data, id } as ProductModel);
  }

  //  ---
  /**
   * Increments the quantity of a specific basket product by its defined step.
   * Ensures the product is quantifiable before attempting the increment.
   * This operation is debounced.
   *
   * @param id - The unique identifier of the basket product.
   * @returns A promise resolving to the updated {@link IBasket} or `undefined`.
   * @throws {DetailedError} If the basket or product is unavailable, or if the product is not quantifiable.
   */
  async function incrementQuantity(id: string): Promise<IBasket | undefined> {
    return isReady().then(async () => {
      if (!basketId.value) {
        throw new DetailedError(
          t("error.basket_not_available"),
          responseCodes.Not_Found,
          ErrorOrigin.Headless
        );
      }
      const basketProduct = findProduct({ id });
      if (!basketProduct) {
        throw new DetailedError(
          t("error.basket_product_not_found"),
          responseCodes.Not_Found,
          ErrorOrigin.Headless
        );
      }
      const qty = get(basketProduct, "configuration.quantity", 1);
      // DataLayer and prefresh are handled in services.ts
      return services.updateQuantity(
        basketId.value,
        add(qty, basketProduct.productDetails.step || 1),
        basketProduct
      );
    });
  }

  /**
   * Decrements the quantity of a specific basket product by its defined step.
   * Ensures the product is quantifiable before attempting the decrement.
   * This operation is debounced.
   *
   * @param id - The unique identifier of the basket product.
   * @returns A promise resolving to the updated {@link IBasket} or `undefined`.
   * @throws {DetailedError} If the basket or product is unavailable, or if the product is not quantifiable.
   */
  async function decrementQuantity(id: string): Promise<IBasket | undefined> {
    return isReady().then(async () => {
      if (!basketId.value) {
        throw new DetailedError(
          t("error.basket_not_available"),
          responseCodes.Not_Found,
          ErrorOrigin.Headless
        );
      }

      const basketProduct = findProduct({ id });
      if (!basketProduct) {
        throw new DetailedError(
          t("error.basket_product_not_found"),
          responseCodes.Not_Found,
          ErrorOrigin.Headless
        );
      }

      const qty = get(basketProduct, "quantity", 1);
      // DataLayer and prefresh are handled in services.ts
      return services.updateQuantity(
        basketId.value,
        subtract(qty, basketProduct.productDetails?.step || 1),
        basketProduct
      );
    });
  }

  /**
   * Updates the quantity of a specific basket product to a specified value.
   * Ensures the product is quantifiable before attempting the update.
   * This operation is debounced.
   *
   * @param id - The unique identifier of the basket product.
   * @param quantity - The new quantity to set for the product.
   * @returns A promise resolving to the updated {@link IBasket} or `undefined`.
   * @throws {DetailedError} If the basket or product is unavailable, not quantifiable, or if the update fails.
   */
  async function updateQuantity(
    id: string,
    quantity: number
  ): Promise<IBasket | undefined> {
    return isReady().then(async () => {
      if (!basketId.value) {
        throw new DetailedError(
          t("error.basket_not_available"),
          responseCodes.Not_Found,
          ErrorOrigin.Headless
        );
      }

      const basketProduct = findProduct({ id });
      if (!basketProduct) {
        throw new DetailedError(
          t("error.basket_product_not_found"),
          responseCodes.Not_Found,
          ErrorOrigin.Headless
        );
      }
      // DataLayer and prefresh are handled in services.ts
      return services.updateQuantity(basketId.value, quantity, basketProduct);
    });
  }

  // --- utils
  /**
   * Creates a debounced version of an asynchronous action function.
   * This helps prevent rapid, concurrent execution of potentially heavy operations
   * by delaying the execution until a specified time after the last call.
   * It also manages a 'processing' state to indicate when an action is active.
   *
   * @template T - The type of the asynchronous function to debounce.
   * @param action - The asynchronous function to debounce (e.g., `remove`, `updateQuantity`).
   * @param delay - The debounce delay in milliseconds. Defaults to `DEBOUNCE_DELAY`.
   * @returns A debounced function that returns a promise resolving to {@link IBasket | undefined}.
   * @throws {DetailedError} If the action is called again while already processing.
   */
  function action<
    T extends (...args: any[]) => Promise<IBasket | undefined | void>
  >(
    action: T,
    delay = DEBOUNCE_DELAY
  ): (...args: Parameters<T>) => Promise<IBasket> {
    return debounce(async (...args: Parameters<T>) => {
      // Assume the first argument is bpid
      const bpid = args[0];
      if (has(processing.value, bpid)) {
        return Promise.reject(
          new DetailedError(
            t("error.basket_product_already_processing"),
            responseCodes.Conflict,
            ErrorOrigin.Headless
          )
        );
      }

      set(processing.value, bpid, true);

      return action(...args).finally(() => {
        set(processing.value, bpid, false);
        unset(processing.value, bpid);
      });
    }, delay) as (...args: Parameters<T>) => Promise<IBasket>;
  }

  // --- Side Effects

  // --- housekeeping: prune config machines for products no longer in the basket
  watch(products, currentProducts => {
    forEach(configRegistry, (config, bpid) => {
      if (!some(currentProducts, ["id", bpid])) {
        config.stop();
        unset(configRegistry, bpid);
      }
    });
  });

  // ---------------------------------------------------------------------------

  return {
    // --- state

    /**
     * Waits for the basket service to be ready (available or error state).
     * @returns {Promise<boolean>} Resolves `true` if ready, `false` if in an error state.
     */
    isReady,

    /**
     * Meta-information computed from the basket's state.
     *
     * @property {boolean} hasProducts - `true` if the basket contains any products.
     * @property {boolean} hasDetails - `true` if any product has configuration details (billing cycle, options, or attributes).
     * @property {boolean} isLoading - `true` if the basket service is currently in a loading state.
     * @property {function(bpid?: string): boolean} isProcessing - A function that returns `true` if the basket or a specific product (`bpid`) is processing, `false` otherwise.
     */
    meta: computed(() => ({
      hasDetails: some(
        products.value,
        p =>
          !!p?.productDetails?.cycle ||
          !isEmpty(p?.configuration?.options) ||
          !isEmpty(p?.configuration?.attributes)
      ),
      hasRecurring: basketMeta.value.hasRecurringProducts,
      hasProducts: basketMeta.value.hasProducts,
      isLoading: basketMeta.value.isLoading,
      isProcessing: (bpid?: string) =>
        bpid ? get(processing.value, bpid, false) : !isEmpty(processing.value)
    })),

    /**
     * Configures and returns a composable for a specific basket product, identified by its ID.
     * This allows for granular control over individual items within the basket.
     *
     * @param bpid - The basket product ID to configure.
     * @returns A promise resolving to the {@link UseBasketProduct} composable for the specified product.
     * @throws {DetailedError} If the basket product is not found.
     */
    configure: async (
      bpid: string,
      options?: { allowMultipleEdits?: boolean }
    ): Promise<UseBasketProduct> => {
      // --- reuse cached config if the underlying service is still running
      const cached = get(configRegistry, bpid) as UseBasketProduct | undefined;
      if (cached) {
        if (!isStoppedService(cached.service)) {
          return Promise.resolve(cached);
        }
        // --- stale entry: service has stopped/completed, clean up and respawn
        unset(configRegistry, bpid);
      }

      const basketProduct = await getBasketProduct(bpid);
      if (isEmpty(basketProduct))
        return Promise.reject(
          new DetailedError(
            t("error.basket_product_not_found"),
            responseCodes.Not_Found,
            ErrorOrigin.Headless
          )
        );

      const config = useBasketProduct(basketProduct.id, options);
      set(configRegistry, bpid, config);
      return Promise.resolve(config);
    },

    // --- context

    /**
     * The reactive list of all {@link BasketProduct}s currently in the basket.
     */
    products,

    // --- methods
    /**
     * Refreshes the entire basket state by fetching the latest data.
     * @returns A promise resolving to the updated {@link IBasket} or `undefined`.
     */
    refresh,

    /**
     * Resolves a product's configuration and updates it in the basket.
     * @param id - The basket product ID.
     * @param data - The updated {@link ProductModel} data.
     * @returns A promise resolving to the updated {@link IBasket} or `undefined`.
     */
    resolve: action((bpid: string, data: ProductModel) => resolve(bpid, data)),

    /**
     * Removes a product from the basket by its ID. This operation is debounced.
     * @param id - The basket product ID to remove.
     * @returns A promise resolving to the updated {@link IBasket} or `undefined`.
     */
    remove: action((bpid: string) => remove(bpid)),

    /**
     * Updates the quantity of a product in the basket to a specific value. This operation is debounced.
     * @param id - The basket product ID.
     * @param value - The new quantity to set.
     * @returns A promise resolving to the updated {@link IBasket} or `undefined`.
     */
    updateQuantity: action((bpid: string, value: number) =>
      updateQuantity(bpid, value)
    ),

    /**
     * Increments the quantity of a product in the basket by its step. This operation is debounced.
     * @param id - The basket product ID.
     * @returns A promise resolving to the updated {@link IBasket} or `undefined`.
     */
    incrementQuantity: action((bpid: string) => incrementQuantity(bpid)),

    /**
     * Decrements the quantity of a product in the basket by its step. This operation is debounced.
     * @param id - The basket product ID.
     * @returns A promise resolving to the updated {@link IBasket} or `undefined`.
     */
    decrementQuantity: action((bpid: string) => decrementQuantity(bpid)),

    /**
     * Finds a product in the basket matching the given mapping.
     * @param {Record<string, any>} mapping The mapping to match.
     * @returns {BasketProduct | undefined} The found product, or undefined.
     */
    findProduct,

    /**
     * Finds ALL products in the basket matching the given mapping.
     * @param {Record<string, any>} mapping The mapping to match.
     * @param {"configuration" | "productDetails" | "meta"} type - The section of the basket product to look into (e.g., 'configuration', 'productDetails', 'meta').
     * @returns {BasketProduct[]} The found products.
     */
    findProducts,

    /**
     * Checks if a product exists in the basket matching the given mapping.
     * @param {Record<string, any>} mapping The mapping to match.
     * @param {"configuration" | "productDetails" | "meta"} type - The section of the basket product to look into (e.g., 'configuration', 'productDetails', 'meta').
     * @returns {boolean} True if the product exists, false otherwise.
     */
    productExists
  };
};

/**
 * Type definition for the return value of the `useBasketProducts` composable.
 * This ensures type safety when accessing the composable's API.
 */
export type UseBasketProducts = ReturnType<typeof useBasketProducts>;
