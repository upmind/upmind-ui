// --- external
import { computed, ref } from "vue";

// --- internal
import { useBasket } from "../basket";
import services from "./services";
import { useDataLayer } from "../system";
const { dataLayer } = useDataLayer();

// --- utils
import { get, add, subtract } from "lodash-es";
import { DetailedError, ErrorOrigin, responseCodes } from "../../utils";

// --- types
import type { BasketProduct } from "./types";
import { ProductModel } from "../product";
import { IBasket } from "@upmind-automation/types";

import { UseBasketProduct, useBasketProduct } from "./useBasketProduct";

// --- utils
import { isEmpty, debounce, includes, remove as _remove } from "lodash-es";
import { DEBOUNCE_DELAY } from "../../utils";

// --- types
// -----------------------------------------------------------------------------

export const useBasketProducts = () => {
  const {
    findProduct,
    products,
    isReady,
    refresh,
    basketId,
    meta: basketMeta,
  } = useBasket();

  // --- state
  const processing = ref<string[]>([]);

  // --- methods
  async function getBasketProduct(
    id: string
  ): Promise<BasketProduct | undefined> {
    return isReady().then(() => findProduct({ id }));
  }

  async function remove(id: string): Promise<IBasket | undefined> {
    if (!basketId.value) {
      throw new DetailedError(
        "[headless] No Basket found",
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      );
    }

    const basketProduct = findProduct({ id });
    if (!basketProduct) {
      throw new DetailedError(
        "[headless] Basket Product not found",
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      );
    }
    return services
      .remove({ basketId: basketId.value, bpid: id })
      .then((_rawBasket: IBasket | undefined) => {
        dataLayer({ event: "remove_from_cart" })
          .withItems(basketProduct)
          .push();
      })
      .then(() => refresh());
  }

  async function resolve(
    id: string,
    data: ProductModel
  ): Promise<IBasket | undefined> {
    if (!basketId.value) {
      throw new DetailedError(
        "[headless] No Basket found",
        responseCodes.Not_Found,
        ErrorOrigin.Headless
      );
    }

    return services
      .update(
        { basketId: basketId.value },
        { data: { ...data, id } as ProductModel }
      )
      .then(() => refresh())
      .then((rawBasket: IBasket | undefined) => {
        const basketProduct = findProduct({ id });
        if (!basketProduct) {
          throw new DetailedError(
            "[headless] Basket Product not found after update",
            responseCodes.Not_Found,
            ErrorOrigin.Headless
          );
        }
        dataLayer({ event: "add_to_cart" }).withItems(basketProduct).push();

        return rawBasket;
      });
  }
  //  ---
  async function incrementQuantity(id: string): Promise<IBasket | undefined> {
    return isReady().then(async () => {
      if (!basketId.value) {
        throw new DetailedError(
          "[headless] No Basket found",
          responseCodes.Not_Found,
          ErrorOrigin.Headless
        );
      }
      const basketProduct = findProduct({ id });
      if (!basketProduct) {
        throw new DetailedError(
          "[headless] Basket Product not found",
          responseCodes.Not_Found,
          ErrorOrigin.Headless
        );
      }
      const qty = get(basketProduct, "configuration.quantity", 1);
      return services
        .updateQuantity(
          {
            basketId: basketId.value,
            basketProduct,
          },
          { data: add(qty, basketProduct.productDetails.step || 1) }
        )
        .then(() => refresh())
        .then((rawBasket: IBasket | undefined) => {
          const basketProduct = findProduct({ id });
          if (!basketProduct) {
            throw new DetailedError(
              "[headless] Basket Product not found after update",
              responseCodes.Not_Found,
              ErrorOrigin.Headless
            );
          }
          dataLayer({ event: "add_to_cart" }).withItems(basketProduct).push();

          return rawBasket;
        });
    });
  }

  async function decrementQuantity(id: string): Promise<IBasket | undefined> {
    return isReady().then(async () => {
      if (!basketId.value) {
        throw new DetailedError(
          "[headless] No Basket found",
          responseCodes.Not_Found,
          ErrorOrigin.Headless
        );
      }

      const basketProduct = findProduct({ id });
      if (!basketProduct) {
        throw new DetailedError(
          "[headless] Basket Product not found",
          responseCodes.Not_Found,
          ErrorOrigin.Headless
        );
      }

      const qty = get(basketProduct, "quantity", 1);
      return services
        .updateQuantity(
          {
            basketId: basketId.value,
            basketProduct,
          },
          { data: subtract(qty, basketProduct.productDetails?.step || 1) }
        )
        .then(() => refresh())
        .then((rawBasket: IBasket | undefined) => {
          const basketProduct = findProduct({ id });
          if (!basketProduct) {
            throw new DetailedError(
              "[headless] Basket Product not found after update",
              responseCodes.Not_Found,
              ErrorOrigin.Headless
            );
          }
          dataLayer({ event: "remove_from_cart" })
            .withItems(basketProduct)
            .push();

          return rawBasket;
        });
    });
  }

  async function updateQuantity(
    id: string,
    quantity: number
  ): Promise<IBasket | undefined> {
    return isReady().then(async () => {
      if (!basketId.value) {
        throw new DetailedError(
          "[headless] No Basket found",
          responseCodes.Not_Found,
          ErrorOrigin.Headless
        );
      }

      const basketProduct = findProduct({ id });
      if (!basketProduct) {
        throw new DetailedError(
          "[headless] Basket Product not found",
          responseCodes.Not_Found,
          ErrorOrigin.Headless
        );
      }
      return services
        .updateQuantity(
          { basketId: basketId.value, basketProduct },
          { data: quantity }
        )
        .then(() => refresh())
        .then((rawBasket: IBasket | undefined) => {
          const basketProduct = findProduct({ id });
          if (!basketProduct) {
            throw new DetailedError(
              "[headless] Basket Product not found after update",
              responseCodes.Not_Found,
              ErrorOrigin.Headless
            );
          }
          dataLayer({ event: "add_to_cart" }).withItems(basketProduct).push();

          return rawBasket;
        });
    });
  }

  // --- utils
  /**
   * Debounce action to prevent multiple calls with a processing state
   * @param action
   * @param delay
   * @returns
   * @example
   * const action = debounceAction(async (bpid: string) => {
   *  await remove(bpid);
   * });
   *  action("123");
   */
  function action<T extends (...args: any[]) => Promise<IBasket | undefined>>(
    action: T,
    delay = DEBOUNCE_DELAY
  ): (...args: Parameters<T>) => Promise<IBasket> {
    return debounce(async (...args: Parameters<T>) => {
      // Assume the first argument is bpid
      const bpid = args[0];
      if (processing.value.includes(bpid)) {
        return Promise.reject(
          new DetailedError(
            "[headless] Already processing",
            responseCodes.Conflict,
            ErrorOrigin.Headless
          )
        );
      }
      processing.value.push(bpid);
      return action(...args).finally(() => {
        processing.value = _remove(processing.value, bpid);
      });
    }, delay) as (...args: Parameters<T>) => Promise<IBasket>;
  }

  // ---------------------------------------------------------------------------

  return {
    // --- state

    isReady,

    meta: computed(() => ({
      hasProducts: !isEmpty(products.value),
      isLoading: basketMeta.value.isLoading,
      isProcessing: (bpid?: string) =>
        bpid ? includes(processing.value, bpid) : !isEmpty(processing.value),
    })),

    configure: async (bpid: string): Promise<UseBasketProduct> => {
      const basketProduct = await getBasketProduct(bpid);
      if (isEmpty(basketProduct))
        return Promise.reject(
          new DetailedError(
            "[headless] Basket product not found.",
            responseCodes.Not_Found,
            ErrorOrigin.Headless
          )
        );
      return Promise.resolve(useBasketProduct(basketProduct.id));
    },

    // --- context
    products,

    // --- methods
    refresh,

    resolve,

    remove: action((bpid: string) => remove(bpid)),

    updateQuantity: action((bpid: string, value: number) =>
      updateQuantity(bpid, value)
    ),

    incrementQuantity: action((bpid: string) => incrementQuantity(bpid)),

    decrementQuantity: action((bpid: string) => decrementQuantity(bpid)),
  };
};
