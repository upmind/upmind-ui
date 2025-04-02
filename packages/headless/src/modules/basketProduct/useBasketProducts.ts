// --- external

// --- internal
import { useBasket } from "../basket";
import services from "./services";
import { useDataLayer } from "../system";
const { dataLayer } = useDataLayer();

// --- utils
import { DetailedError, responseCodes } from "../../utils";
import { parseEcommerceItem } from "../system/analytics/utils";
import { get, add, subtract, map } from "lodash-es";

// --- types
import type { BasketProduct } from "./types";
import { ProductModel } from "../product";
import { IBasket } from "@upmind-automation/types";

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
      const basketProduct = findProduct({ id });
      if (!basketProduct) {
        throw new DetailedError(
          "Basket Product not found",
          responseCodes.Not_Found
        );
      }
      return services
        .remove({ basketId: getBasketId(), bpid: id })
        .then((rawBasket: IBasket) => {
          dataLayer({ event: "remove_from_cart" })
            .withItems(map(rawBasket?.products, parseEcommerceItem))
            .push();
        })
        .then(refresh);
    },

    resolve: async (id: string, data: BasketProduct): Promise<void> => {
      return services
        .update(
          { basketId: getBasketId() },
          { data: { ...data, id } as ProductModel }
        )
        .then((rawBasket: IBasket) => {
          dataLayer({ event: "add_to_cart" })
            .withItems(map(rawBasket?.products, parseEcommerceItem))
            .push();
        })
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
          .then((rawBasket: IBasket) => {
            dataLayer({ event: "add_to_cart" })
              .withItems(map(rawBasket?.products, parseEcommerceItem))
              .push();
          })
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
          .then((rawBasket: IBasket) => {
            dataLayer({ event: "remove_from_cart" })
              .withItems(map(rawBasket?.products, parseEcommerceItem))
              .push();
          })
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
          .then((rawBasket: IBasket) => {
            dataLayer({ event: "add_to_cart" })
              .withItems(map(rawBasket?.products, parseEcommerceItem))
              .push();
          })
          .then(refresh);
      });
    },
  };
};
