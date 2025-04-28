// --- external

// --- internal
import { useBasket } from "../basket";
import services from "./services";
import { useDataLayer } from "../system";
const { dataLayer } = useDataLayer();

// --- utils
import { DetailedError, responseCodes } from "../../utils";
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
    remove: async (id: string): Promise<IBasket> => {
      const basketId = getBasketId();
      if (!basketId) {
        throw new DetailedError("No Basket found", responseCodes.Not_Found);
      }

      const basketProduct = findProduct({ id });
      if (!basketProduct) {
        throw new DetailedError(
          "Basket Product not found",
          responseCodes.Not_Found
        );
      }
      return services
        .remove({ basketId, bpid: id })
        .then((rawBasket: IBasket) => {
          dataLayer({ event: "remove_from_cart" })
            .withItems(basketProduct)
            .push();
        })
        .then(() => refresh());
    },

    resolve: async (id: string, data: ProductModel): Promise<IBasket> => {
      const basketId = getBasketId();
      if (!basketId) {
        throw new DetailedError("No Basket found", responseCodes.Not_Found);
      }

      return services
        .update({ basketId }, { data: { ...data, id } as ProductModel })
        .then(() => refresh())
        .then((rawBasket: IBasket) => {
          const basketProduct = findProduct({ id });
          if (!basketProduct) {
            throw new DetailedError(
              "Basket Product not found after update",
              responseCodes.Not_Found
            );
          }
          dataLayer({ event: "add_to_cart" }).withItems(basketProduct).push();

          return rawBasket;
        });
    },
    // ---
    incrementQuantity: async (id: string): Promise<IBasket> => {
      return isReady().then(() => {
        const basketId = getBasketId();
        if (!basketId) {
          throw new DetailedError("No Basket found", responseCodes.Not_Found);
        }
        const basketProduct = findProduct({ id });
        if (!basketProduct) {
          throw new DetailedError(
            "Basket Product not found",
            responseCodes.Not_Found
          );
        }
        const qty = get(basketProduct, "configuration.quantity", 1);
        return services
          .updateQuantity(
            {
              basketId,
              basketProduct,
            },
            { data: add(qty, basketProduct.productDetails.step || 1) }
          )
          .then(() => refresh())
          .then((rawBasket: IBasket) => {
            const basketProduct = findProduct({ id });
            if (!basketProduct) {
              throw new DetailedError(
                "Basket Product not found after update",
                responseCodes.Not_Found
              );
            }
            dataLayer({ event: "add_to_cart" }).withItems(basketProduct).push();

            return rawBasket;
          });
      });
    },

    decrementQuantity: async (id: string): Promise<IBasket> => {
      return isReady().then(() => {
        const basketId = getBasketId();
        if (!basketId) {
          throw new DetailedError("No Basket found", responseCodes.Not_Found);
        }

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
              basketId,
              basketProduct,
            },
            { data: subtract(qty, basketProduct.productDetails?.step || 1) }
          )
          .then(() => refresh())
          .then((rawBasket: IBasket) => {
            const basketProduct = findProduct({ id });
            if (!basketProduct) {
              throw new DetailedError(
                "Basket Product not found after update",
                responseCodes.Not_Found
              );
            }
            dataLayer({ event: "remove_from_cart" })
              .withItems(basketProduct)
              .push();

            return rawBasket;
          });
      });
    },

    updateQuantity: async (id: string, quantity: number): Promise<IBasket> => {
      return isReady().then(() => {
        const basketId = getBasketId();
        if (!basketId) {
          throw new DetailedError("No Basket found", responseCodes.Not_Found);
        }

        const basketProduct = findProduct({ id });
        if (!basketProduct) {
          throw new DetailedError(
            "Basket Product not found",
            responseCodes.Not_Found
          );
        }
        return services
          .updateQuantity({ basketId, basketProduct }, { data: quantity })
          .then(() => refresh())
          .then((rawBasket: IBasket) => {
            const basketProduct = findProduct({ id });
            if (!basketProduct) {
              throw new DetailedError(
                "Basket Product not found after update",
                responseCodes.Not_Found
              );
            }
            dataLayer({ event: "add_to_cart" }).withItems(basketProduct).push();

            return rawBasket;
          });
      });
    },
  };
};
