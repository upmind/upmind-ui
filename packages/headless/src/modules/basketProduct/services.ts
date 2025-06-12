// --- external

// --- internal
import { useBrand } from "../brand";
import { QueryResponse, useQuery } from "../..";

// --- utils
import { parseQuantity } from "../product/utils";
import { unflattenErrors, useTime } from "../../utils";
import { parseBasketProductData, parseBasketProductError } from "./utils";

import {
  get,
  map,
  set,
  first,
  isNil,
  concat,
  filter,
  reduce,
  forEach,
  isEmpty,
  isArray,
} from "lodash-es";

// --- types
import type { IBasket } from "@upmind-automation/types";
import type { ActorRef } from "xstate";
import { BrandConfigKeys } from "@upmind-automation/types";
import type { ProductDetails, ProductModel } from "../product";
import type { BasketProduct, IBasketProductModel } from "./types";

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
  if (!productId) return Promise.reject(new Error("No Product ID provided"));

  // lets ensure we have a valid currency > fallback to default
  // as well as ensuring our promo display type is available
  const { validateCurrency, ensureConfig } = useBrand();
  const [currency] = await Promise.all([
    validateCurrency({ id: currencyId }),
    ensureConfig(BrandConfigKeys.SHOW_PROMOTION_AS),
  ]);

  // ---
  const { get, useUrl } = useQuery();
  // lets ensure we parse our promotions correctly
  const promocodes = map(promotions, "promotion.code").join();

  const params = {
    currency_id: currency?.id,
    promotions: promocodes,
    with: [
      "image",
      "prices",
      "products_attributes",
      "products_options",
      "products_options.prices",
      `category${".top_category".repeat(4)}`,
    ].join(),
  };
  // conditionally add the basket_id / basket_product_id if we have them,
  // this is important to get the correct prices once added to the basket
  if (basketId) set(params, "basket_id", basketId);
  if (bpid) set(params, "basket_product_id", bpid);

  return get({
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
  });
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
 * @param {string[]} event.data.productIds - An array of product IDs to fetch.
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
): Promise<any> {
  if (isEmpty(productIds))
    return Promise.reject(new Error("No Product ID provided"));

  // let's ensure we have a valid currency > fallback to default
  const currency = await useBrand().validateCurrency({ id: currencyId });
  // ---
  const { get, useUrl } = useQuery();

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

  return get({
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
  });
}

/**
 * Fetches related products for a given product in a basket.
 *
 * @param context - The parameters for fetching related products.
 * @param context.basketId - The ID of the basket.
 * @param context.currencyId - The ID of the currency (optional).
 * @param context.promotions - An array of promotion IDs (optional).
 * @param options - Additional options for fetching related products.
 * @param options.data - The data object containing the product ID and pagination options.
 * @param options.data.productId - The ID of the product.
 * @param options.data.limit - The maximum number of related products to fetch (default is 4).
 * @param options.data.offset - The offset for pagination (default is 0).
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
  if (!productId) return Promise.reject(new Error("No Product ID provided"));

  // lets ensure we have a valid currency > fallback to default
  const currency = await useBrand().validateCurrency({ id: currencyId });
  // ---
  const { get, useUrl } = useQuery();

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

  return get({
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
  });
}

/**
 * Updates a product quantity
 *
 * @param context - The parameters for the update operation.
 * @param context.basketId - The ID of the basket.
 * @param context.basketProduct - The basket product to be updated.
 * @param event - Additional event for the update operation.
 * @param event.data - The new quantity for the product.
 * @returns A promise that resolves with the updated basket data.
 * @throws Will reject the promise if no basket ID is provided, if the product is not found, or if the product is not quantifiable.
 * @throws Will reject the promise if the quantity is invalid.
 */
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
  if (!basketId)
    return Promise.reject(new Error("No basket provided/available"));
  if (!basketProduct.productDetails)
    return Promise.reject(new Error("Product not found"));
  if (!basketProduct.productDetails?.quantifiable)
    return Promise.reject(new Error("Product not quantifiable"));
  // ---
  const { put, useUrl } = useQuery();
  basketProduct.configuration.quantity = parseQuantity(
    data,
    basketProduct.productDetails as ProductDetails
  );
  const product = parseBasketProductData(basketProduct.configuration);
  return put<IBasket>({
    url: useUrl(`/orders/${basketId}/products/${basketProduct.id}`),
    data: product,
    withAccessToken: true,
  })
    .then(({ data }) => {
      if (isNil(data)) throw new Error("No data returned from the server");
      return data;
    })
    .catch(parseApiErrors);
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
  if (!basketId)
    return Promise.reject(new Error("No basket provided/available"));
  if (isEmpty(data))
    return Promise.reject(new Error("No product data provided"));

  const product = parseBasketProductData(data, promotions);
  // ---
  const isNew = !data?.id;

  const action = isNew ? post : put;
  const suffix = isNew ? "" : `/${data.id}`;
  // ---
  return action<IBasket>({
    url: useUrl(`/orders/${basketId}/products${suffix}`),
    data: product,
    withAccessToken: true,
  })
    .then(({ data }) => {
      if (isNil(data)) throw new Error("No data returned from the server");
      return data;
    })
    .catch(parseApiErrors);
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
  if (!basketId)
    return Promise.reject(new Error("No basket provided/available"));

  // When updating the basket we need to provide :
  //   * ALL products that are valid and ready to be saved
  //   * ALL other existing products already in the basket
  // otherwise the existing products will be removed from the basket

  const validItems = filter(data, item =>
    item.getSnapshot().matches("available.valid")
  ) as ActorRef<any>[];

  // --- then build the basket config for the validItems products
  const products = map(validItems, item => {
    const id = get(item.getSnapshot(), "context.rawBasketProduct.id");
    // inform the item that it is being processed
    item.send({ type: "PROCESSING" });
    // ---
    const model = get(item, "state.context.model");
    if (!model) return Promise.reject(new Error("No model found"));
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
    (result: IBasketProductModel[], item: BasketProduct) => {
      const id = get(item, "id");

      if (id) {
        const product = parseBasketProductData(item.configuration, promotions);
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
  return put<IBasket>({
    url: useUrl(`/orders/${basketId}`),
    data: { products: concat(existingProducts, products) },
    withAccessToken: true,
  })
    .then(({ data }) => {
      forEach(validItems, item => item.send({ type: "UPDATED" }));

      if (isNil(data)) throw new Error("No data returned from the server");
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
  if (!bpid) return Promise.reject(new Error("No product provided")); // we don't need to make a request as there is no id, must be a new product
  if (!basketId)
    return Promise.reject(new Error("No basket provided/available"));
  // ---
  return del<IBasket>({
    url: useUrl(`/orders/${basketId}/products/${bpid}`),
    withAccessToken: true,
  }).then(({ data }) => {
    if (isNil(data)) throw new Error("No data returned from the server");
    return data;
  });
}

function parseApiErrors(response: QueryResponse) {
  if (!response?.error) return Promise.reject(response);
  // rawErrors will return a flattened object path in dot notation, so we need to convert back it to an object
  const rawErrors = unflattenErrors(response.error.data);
  // Currently we receive errors in 2 ways,
  // 1) Options or Attributes returns an collection of products with errors, we only look at the first ( and usually only )
  // 2) Provision fields returns an object
  if (isArray(rawErrors?.products)) {
    response.error.data = parseBasketProductError(first(rawErrors?.products));
  } else {
    response.error.data = parseBasketProductError(rawErrors);
  }

  return Promise.reject(response);
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
