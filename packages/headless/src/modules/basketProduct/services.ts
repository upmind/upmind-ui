// --- external

// --- internal
import { useQuery } from "../..";
import { useBrand } from "../brand";

// --- utils
import { useTime } from "../../utils";
import { parseBasketProductData } from "./utils";
import { parseQuantity } from "../product/utils";

import {
  concat,
  filter,
  forEach,
  get,
  isEmpty,
  map,
  reduce,
  set,
} from "lodash-es";
import { ActorRef } from "xstate";
import { IBasket } from "@upmind-automation/types";

// --- types
import type { ProductDetails, ProductModel } from "../product";
import type { BasketProduct } from "../basketProduct";

// -----------------------------------------------------------------------------

/**
 * Fetches a single product with details .
 *
 * @param context - The parameters for fetching the product details.
 * @param context.bpid - The basket product ID (optional).
 * @param context.basketId - The basket ID.
 * @param context.currencyId - The currency ID (optional).
 * @param context.promotions - An array of promotion codes (optional).
 * @param event - The event containing additional data.
 * @param event.data - The data object containing the product ID.
 * @param event.data.productId - The product ID.
 * @returns A promise that resolves with the product data or rejects with an error message.
 */
async function fetch(
  {
    bpid,
    basketId,
    currencyId,
    promotions,
  }: {
    bpid?: string;
    basketId: string;
    currencyId?: string;
    promotions?: string[];
  },
  { data: { productId } }: { data: { productId: string } }
) {
  if (!productId) return Promise.reject("No Product ID provided");

  // lets ensure we have a valid currency > fallback to default
  const currency = await useBrand().validateCurrency({ id: currencyId });
  // ---
  const { get: getRequest, useUrl } = useQuery();
  const params = {
    currency_id: currency?.id,
    promotions: (promotions ?? []).join(","), // ensure we pass any applied promotions to get the correct prices
    with: [
      "image",
      "prices",
      "products_attributes",
      "products_options",
      "products_options.prices",
    ].join(),
  };
  // conditionally add the basket_id / basket_product_id if we have them,
  // this is important to get the correct prices once added to the basket
  if (basketId) set(params, "basket_id", basketId);
  if (bpid) set(params, "basket_product_id", bpid);

  // lets ensure we parse our promotions correctly
  const promocodes = map(promotions, "promotion.code").join();

  return getRequest({
    url: useUrl(`basket/products/${productId}`, params),
    queryKey: [
      "basket",
      "products",
      "fetch",
      productId,
      {
        currency: currency?.id,
        promotions: promocodes,
      },
    ],
    staleTime: useTime()?.DAY, // product data is not updated often, so we can cache for a day
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

/**
 * Fetches selected products for a given currency, applying any promotions if provided.
 *
 * @param {Object} context - The context for fetching selected products.
 * @param {string} context.basketId - The ID of the basket.
 * @param {string} [context.currencyId] - The ID of the currency (optional).
 * @param {string[]} [context.promotions] - An array of promotion IDs (optional).
 * @param {Object} event - The event containing product IDs.
 * @param {Object} event.data - The data object containing product IDs.
 * @param {string[]} context.data.productIds - An array of product IDs to fetch.
 * @returns {Promise<any>} A promise that resolves with the fetched product data or rejects with an error message.
 * @throws Will reject with "No Product ID provided" if no product IDs are given.
 */
async function fetchSelected(
  {
    basketId,
    currencyId,
    promotions,
  }: {
    basketId: string;
    currencyId?: string;
    promotions?: string[];
  },
  { data: { productIds } }: { data: { productIds: string[] } }
) {
  if (isEmpty(productIds)) return Promise.reject("No Product ID provided");

  // let's ensure we have a valid currency > fallback to default
  const currency = await useBrand().validateCurrency({ id: currencyId });
  // ---
  const { get: getRequest, useUrl } = useQuery();

  const params = {
    currency_id: currency?.id,
    promotions: (promotions ?? []).join(","), // ensure we pass any applied promotions to get the correct prices
    "filter[id]": productIds.join(","),
    limit: productIds.length,
    with: [
      "image",
      "prices",
      "products_attributes",
      "products_options",
      "products_options.prices",
    ].join(),
  };
  // conditionally add the basket_id / basket_product_id if we have them,
  // this is important to get the correct prices once added to the basket
  if (basketId) set(params, "basket_id", basketId);

  // lets ensure we parse our promotions correctly
  const promocodes = map(promotions, "promotion.code").join();

  return getRequest({
    url: useUrl(`basket/products/`, params),
    queryKey: [
      "basket",
      "products",
      "fetch-selected",
      productIds,
      {
        currency: currency?.id,
        promotions: promocodes,
      },
    ],
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

/**
 * Fetches related products for a given product in a basket.
 *
 * @param context - The parameters for fetching related products.
 * @param context.basketId - The ID of the basket.
 * @param context.currencyId - The ID of the currency (optional).
 * @param context.promotions - An array of promotion IDs (optional).
 * @param options - Additional options for fetching related products.
 * @param event.data - The data for fetching related products.
 * @param event.data.productId - The ID of the product.
 * @param event.data.limit - The maximum number of related products to fetch (default is 4).
 * @param event.data.offset - The offset for pagination (default is 0).
 * @returns A promise that resolves to the related products data.
 * @throws Will reject the promise if no product ID is provided.
 */
async function fetchRelated(
  {
    basketId,
    currencyId,
    promotions,
  }: {
    basketId: string;
    currencyId?: string;
    promotions?: string[];
  },
  {
    data: { productId, limit = 4, offset = 0 },
  }: {
    data: {
      productId: string;
      limit: number;
      offset: number;
    };
  }
) {
  if (!productId) return Promise.reject("No Product ID provided");

  // lets ensure we have a valid currency > fallback to default
  const currency = await useBrand().validateCurrency({ id: currencyId });
  // ---
  const { get: getRequest, useUrl } = useQuery();

  const params = {
    currency_id: currency?.id,
    promotions: (promotions ?? []).join(","), // ensure we pass any applied promotions to get the correct prices
    limit,
    offset,
    omit_basket_products: true,
    "filter[active]": true,
    order: "order",
    with: [
      "image",
      "prices",
      "products_attributes",
      "products_options",
      "products_options.prices",
    ].join(),
  };
  // conditionally add the basket_id / basket_product_id if we have them,
  // this is important to get the correct prices once added to the basket
  if (basketId) set(params, "basket_id", basketId);

  // lets ensure we parse our promotions correctly
  const promocodes = map(promotions, "promotion.code").join();

  return getRequest({
    url: useUrl(`basket/products/${productId}/related`, params),
    queryKey: [
      "basket",
      "products",
      "fetch-related",
      productId,
      {
        limit,
        offset,
        currency: currency?.id,
        promotions: promocodes,
      },
    ],
    staleTime: useTime()?.DAY, // product data is not updated often, so we can cache for a day
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

async function updateQuantity(
  {
    basketId,
    basketProduct,
  }: {
    basketId: string;
    basketProduct: BasketProduct;
  },
  { data }: { data: number }
): Promise<IBasket> {
  // sanity check
  if (!basketId) return Promise.reject("No basket provided/available");
  if (!basketProduct.productDetails) return Promise.reject("Product not found");
  if (!basketProduct.productDetails?.quantifiable)
    return Promise.reject("Product not quantifiable");
  // ---
  const { put, useUrl } = useQuery();
  basketProduct.configuration.quantity = parseQuantity(
    data,
    basketProduct.productDetails as ProductDetails
  );
  const product = parseBasketProductData(basketProduct.configuration);
  return put({
    url: useUrl(`/orders/${basketId}/products/${basketProduct.id}`),
    data: product,
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

/**
 * Updates a product in the basket.
 *
 * @param context - The parameters for the update operation.
 * @param context.basketId - The ID of the basket.
 * @param context.currencyId - (Optional) The ID of the currency.
 * @param context.promotions - (Optional) An array of promotion IDs.
 * @param event - Additional event for the update operation.
 * @param event.data - The product data to be updated.
 * @returns A promise that resolves with the updated product data.
 * @throws Will reject the promise if no basket ID is provided or if no product data is provided.
 */
async function update(
  {
    basketId,
    currencyId,
    promotions,
  }: {
    basketId: string;
    currencyId?: string;
    promotions?: string[];
  },
  { data }: { data: ProductModel }
): Promise<IBasket> {
  const { put, post, useUrl } = useQuery();
  if (!basketId) return Promise.reject("No basket provided/available");
  if (isEmpty(data)) return Promise.reject(`No product data provided`);

  const product = parseBasketProductData(data, promotions);
  // ---
  const isNew = !data?.id;

  const action = isNew ? post : put;
  const suffix = isNew ? "" : `/${data.id}`;
  // ---
  return action({
    url: useUrl(`/orders/${basketId}/products${suffix}`),
    data: product,
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

/**
 * Add/Update Many basket withnew valid products and existing products.
 *
 * @param {Object} context - The parameters for the sync function.
 * @param {string} context.basketId - The ID of the basket to be updated.
 * @param {Array} context.basketProducts - The existing products in the basket.
 * @param {Array} context.promotions - The promotions to be applied to the products.
 * @param {Object} event - The event for the sync function.
 * @param {Array} event.data - The data containing the products to be validated and added to the basket.
 *
 * @returns {Promise<any>} - A promise that resolves with the updated basket data or rejects with an error.
 *
 * @throws {Error} - Throws an error if no basket ID is provided or if a model is not found for a product.
 */
async function updateMany(
  { basketId, basketProducts, promotions }: any,
  { data }: { data: ActorRef<any>[] }
): Promise<IBasket> {
  if (!basketId) return Promise.reject("No basket provided/available");

  // When updating the basket we need to provide :
  //   * ALL products that are valid and ready to be saved
  //   * ALL other existing products already in the basket
  // otherwise the existing products will be removed from the basket

  const validItems = filter(data, item =>
    item.getSnapshot().matches("available.valid")
  ) as ActorRef<any>[];

  // --- then build the basket config for the validItems products
  const products = map(validItems, item => {
    const id = get(item, "state.context.basketProduct.id");
    // inform the item that it is being processed
    item.send({ type: "PROCESSING" });
    // ---
    const model = get(item, "state.context.model");
    if (!model) return Promise.reject("No model found");
    // ---
    const product = parseBasketProductData(model, promotions);
    // Add a flag to the product to indicate that the field values should NOT be validated.
    //  we want to ge these products in without deep validation
    set(product, "provision_field_values_validate", false);

    if (id) set(product, "order_product_id", id);

    return product;
  });

  // --- then build the minimal basket config for the existing products
  // the existing products dont need to have their full config, just the id
  const existingProducts = reduce(
    basketProducts,
    (result: any[], item: any) => {
      const id = get(item, "id");

      if (id) {
        const product = parseBasketProductData(item, promotions);
        // Add a flag to the product to indicate that the field values should NOT be validated.
        //  we want to ge these products in without deep validation
        set(product, "provision_field_values_validate", false);
        set(product, "order_product_id", id);
        result.push(product);
      }

      return result;
    },
    []
  );

  // ---
  const { put, useUrl } = useQuery();
  return put({
    url: useUrl(`/orders/${basketId}`),
    data: { products: concat(existingProducts, products) },
    withAccessToken: true,
  })
    .then(({ data }: any) => {
      forEach(validItems, item => item.send({ type: "UPDATED" }));
      return data;
    })
    .catch(error => {
      forEach(validItems, item => item.send({ type: "CANCEL" }));
      return Promise.reject(error);
    });
}

/**
 * Removes a product from the basket.
 *
 * @param {Object} context - The parameters for the remove function.
 * @param {string} context.basketId - The ID of the basket.
 * @param {string} context.bpid - The ID of the product in the basket.
 * @returns {Promise<any>} A promise that resolves with the response data if the product is successfully removed,
 * or rejects with an error message if no basket ID is provided.
 */
async function remove({
  basketId,
  bpid,
}: {
  basketId: string;
  bpid: string;
}): Promise<IBasket> {
  const { del, useUrl } = useQuery();
  if (!basketId) return Promise.reject("No basket provided/available");
  if (!bpid) return Promise.reject("No product provided"); // we dont need to make a request as there is no id, must be a new product
  // ---
  return del({
    url: useUrl(`/orders/${basketId}/products/${bpid}`),
    withAccessToken: true,
  }).then(({ data }: any) => data);
}
// -----------------------------------------------------------------------------

export default {
  fetch,
  fetchSelected,
  fetchRelated,
  updateQuantity,
  update,
  updateMany,
  remove,
};
