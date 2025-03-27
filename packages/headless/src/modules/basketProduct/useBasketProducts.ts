// --- external

// --- internal
import { useBasket } from "../basket";
import services from "./services";

// --- utils
import { DetailedError, responseCodes } from "../../utils";
import { get, add, subtract } from "lodash-es";

// --- types
import type { BasketProduct } from "./types";
import { ProductModel } from "../product";

// -----------------------------------------------------------------------------

export const useBasketProducts = () => {
  const { findProduct, getProducts, isReady, refresh, getBasketId } =
    useBasket();

  return {
    getProducts,
    isReady,
    // ---
    get: async (id: string): Promise<BasketProduct | undefined> => {
      return isReady().then(() => findProduct({ id }));
    },
    remove: async (id: string): Promise<void> => {
      return services
        .remove({ basketId: getBasketId(), bpid: id })
        .then(refresh);
    },

    resolve: async (id: string, data: BasketProduct): Promise<void> => {
      return services
        .update(
          { basketId: getBasketId() },
          { data: { ...data, id } as ProductModel }
        )
        .then(refresh);
    },
    // ---
    incrementQuantity: async (id: string): Promise<void> => {
      return isReady().then(() => {
        const basketProduct = findProduct({ id });
        if (!basketProduct) {
          throw new DetailedError(
            "Basket Product not found",
            responseCodes.Not_Found
          );
        }
        const qty = get(basketProduct, "quantity", 1);
        return services
          .updateQuantity(
            {
              basketId: getBasketId(),
              basketProduct,
            },
            { data: add(qty, basketProduct.product.step || 1) }
          )
          .then(refresh);
      });
    },

    decrementQuantity: async (id: string): Promise<void> => {
      return isReady().then(() => {
        const basketProduct = findProduct({ id });
        if (!basketProduct) {
          throw new DetailedError(
            "Basket Product not found",
            responseCodes.Not_Found
          );
        }

        const qty = get(basketProduct, "quantity", 1);
        return services
          .updateQuantity(
            {
              basketId: getBasketId(),
              basketProduct,
            },
            { data: subtract(qty, basketProduct.product?.step || 1) }
          )
          .then(refresh);
      });
    },

    updateQuantity: async (id: string, quantity: number): Promise<void> => {
      return isReady().then(() => {
        const basketProduct = findProduct({ id });
        if (!basketProduct) {
          throw new DetailedError(
            "Basket Product not found",
            responseCodes.Not_Found
          );
        }
        return services
          .updateQuantity(
            { basketId: getBasketId(), basketProduct },
            { data: quantity }
          )
          .then(refresh);
      });
    },
  };
};
