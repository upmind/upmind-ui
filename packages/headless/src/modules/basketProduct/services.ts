// --- external
import { AsyncQueuer } from "@tanstack/pacer";

// --- internal
import { useBrand } from "../brand";
import {
  invalidateQueryByKey,
  RequestSortDirection,
  useBasket,
  useBasketCurrency,
  useDataLayer,
  useI18n,
  useQuery,
  useTracking
} from "../..";

// --- utils
import { parseQuantity } from "../product/utils";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  type ResponseError,
  unflattenErrors,
  useTime
} from "../../utils";
import {
  parseBasketProductData,
  parseBasketProductError,
  parsePromotionsOrCoupons,
  reconcileProvisionFields
} from "./utils";

import {
  get,
  map,
  set,
  first,
  isNil,
  concat,
  reduce,
  isEmpty,
  isArray,
  isFunction,
  forEach,
  differenceBy,
  find
} from "lodash-es";

// --- types
import type { IBasket } from "@upmind-automation/types";
import { BrandConfigKeys } from "@upmind-automation/types";
import type { ProductDetails, ProductModel, ProductProps } from "../product";
import type { BasketProduct, IBasketProductModel } from "./types";

// -----------------------------------------------------------------------------

/**
 * A queue to manage basket product operations sequentially.
 * This ensures that basket updates are processed one at a time to prevent conflicts and overwhelming the server.
 * Each task in the queue can be of type "UPDATE_MANY", "UPDATE", "UPDATE_QUANTITY", or "REMOVE".
 */
const queue = new AsyncQueuer<{
  type: string;
  data?: any;
  resolve?: (data: IBasket) => void;
  reject?: (error?: Error) => void;
}>(
  async ({ type, data }) => {
    switch (type) {
      case "UPDATE_MANY":
        return updateMany(data);

      case "UPDATE":
        return update(data);

      case "UPDATE_QUANTITY":
        return updateQuantity(data);

      case "REMOVE":
        return remove(data);

      default:
        throw new DetailedError(
          `Unsupported task type: ${type}`,
          responseCodes.Bad_Request,
          ErrorOrigin.Headless
        );
    }
  },
  {
    // wait: 3000, // Wait 3 seconds between starting new items
    concurrency: 1, // Process 1 item at once
    started: true, // Start processing immediately
    key: "basketProducts", // Identify this queuer in devtools

    /**
     * Handles errors that occur during the processing of a queue item.
     * We use the provided reject function to pass the error back to the caller.
     * @param error  The error that occurred.
     * @param item  The queue item that was being processed when the error occurred.
     * @param queuer  The queuer instance managing the queue.
     */
    onError: (error, item, queuer) => {
      if (isFunction(item?.reject)) item.reject(error);
    },

    /**
     * Handles the successful processing of a queue item.
     * We use the provided resolve function to pass the result back to the caller.
     * We also potentially refresh the basket if the queue is empty after this operation.
     * We only do this once all queued operations are complete to avoid multiple refreshes.
     * @param result  The result of the successful operation.
     * @param item  The queue item that was successfully processed.
     * @param queuer  The queuer instance managing the queue.
     */
    onSuccess: (result, item, queuer) => {
      if (isFunction(item?.resolve)) item.resolve(result);

      if (queuer.store.state.isEmpty) {
        invalidateQueryByKey(["basket"], { exact: false });
        useBasket().refresh(result);
      }
    }
  }
);

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
    promotions
  }: {
    bpid?: string;
    basketId?: string;
    currencyId?: string;
    promotions?: string[];
  },
  { data: { productId } }: { data: { productId: string } }
) {
  const { t } = useI18n();
  if (!productId)
    throw new DetailedError(
      t("error.product_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );

  // lets ensure we have a valid currency > fallback to default
  // as well as ensuring our promo display type is available
  const { validateCurrency, ensureConfig } = useBrand();
  const [currency] = await Promise.all([
    validateCurrency({ id: currencyId }),
    ensureConfig(BrandConfigKeys.SHOW_PROMOTION_AS)
  ]);

  // ---
  const { get, useUrl } = useQuery();
  // lets ensure we parse our promotions correctly
  const promocodes = parsePromotionsOrCoupons(promotions).join();

  const params = {
    currency_id: currency?.id,
    promotions: promocodes,
    with: [
      "image",
      "images",
      "prices",
      "products_attributes",
      "products_options",
      "products_options.prices",
      "related",
      `category${".top_category".repeat(4)}`
    ].join()
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
        basketId,
        currency: currency?.id,
        promotions: promocodes
      }
    ],
    staleTime: useTime()?.DAY, // product data is not updated often, so we can cache for a day
    withAccessToken: true
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
    promotions
  }: {
    basketId?: string;
    currencyId?: string;
    promotions?: string[];
  },
  { data: { productIds } }: { data: { productIds: string[] } }
): Promise<any> {
  const { t } = useI18n();
  if (isEmpty(productIds))
    throw new DetailedError(
      t("error.product_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );

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
      "images",
      "prices",
      "products_attributes",
      "products_options",
      "products_options.prices",
      "related",
      `category${".top_category".repeat(4)}`
    ].join()
  };
  // conditionally add the basket_id / basket_product_id if we have them,
  // this is important to get the correct prices once added to the basket
  if (basketId) set(params, "basket_id", basketId);

  // lets ensure we parse our promotions correctly
  const promocodes = parsePromotionsOrCoupons(promotions).join();

  return get({
    url: useUrl(`basket/products/`, params),
    queryKey: [
      "basket",
      "products",
      "fetch-selected",
      productIds,
      {
        basketId,
        currency: currency?.id,
        promotions: promocodes
      }
    ],
    withAccessToken: true
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
    promotions
  }: {
    basketId?: string;
    currencyId?: string;
    promotions?: string[];
  },
  {
    data: { productId, limit = 4, offset = 0 }
  }: {
    data: {
      productId: string;
      limit: number;
      offset: number;
    };
  }
) {
  const { t } = useI18n();
  if (!productId)
    throw new DetailedError(
      t("error.product_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );

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
    with: [
      "image",
      "images",
      "prices",
      "products_attributes",
      "products_options",
      "products_options.prices",
      "related",
      `category${".top_category".repeat(4)}`
    ].join()
  };
  // conditionally add the basket_id / basket_product_id if we have them,
  // this is important to get the correct prices once added to the basket
  if (basketId) set(params, "basket_id", basketId);

  // lets ensure we parse our promotions correctly
  const promocodes = parsePromotionsOrCoupons(promotions).join();

  return get({
    url: useUrl(`basket/products/${productId}/related`, params),
    sort: [[RequestSortDirection.ASC, "order"]],
    queryKey: [
      "basket",
      "products",
      "fetch-related",
      productId,
      {
        limit,
        offset,
        basketId,
        currency: currency?.id,
        promotions: promocodes
      }
    ],
    staleTime: useTime()?.DAY, // product data is not updated often, so we can cache for a day
    withAccessToken: true
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
async function updateQuantity({
  basketId,
  quantity,
  basketProduct
}: {
  basketId: IBasket["id"];
  quantity: number;
  basketProduct: BasketProduct;
}): Promise<IBasket> {
  const { t } = useI18n();
  // sanity check
  if (!basketId)
    throw new DetailedError(
      t("error.basket_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );

  if (!basketProduct.productDetails)
    throw new DetailedError(
      t("error.product_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );
  if (!basketProduct.productDetails?.quantifiable)
    throw new DetailedError(
      t("error.product_quantifiable_not_available"),
      responseCodes.Unprocessable_Entity,
      ErrorOrigin.Headless
    );
  // ---
  const { put, useUrl } = useQuery();
  basketProduct.configuration.quantity = parseQuantity(
    quantity,
    basketProduct.productDetails as ProductDetails
  );
  const product = parseBasketProductData(basketProduct.configuration);
  return put<IBasket>({
    mutationKey: ["basket", "products", basketProduct.id],
    url: useUrl(`/orders/${basketId}/products/${basketProduct.id}`),
    data: product,
    withAccessToken: true
  })
    .then(data => {
      if (isNil(data)) {
        throw new DetailedError(
          t("error.basket_not_available"),
          responseCodes.Internal_Server_Error,
          ErrorOrigin.Headless
        );
      }
      return data;
    })
    .catch(parseApiErrors);
}

/**
 *  Generates the data required to create a new basket.
 */
async function generateBasket(products: IBasketProductModel[] = []) {
  // ---
  const { t } = useI18n();
  const { post, useUrl } = useQuery();
  const { get: getTracking } = useTracking();
  const { currencyCode } = useBasketCurrency();

  // For basket creation (POST /orders), promotions must be at the root payload
  // level, not nested inside each product. Extract and hoist them.
  const promotions = reduce(
    products,
    (acc: any[], product) => {
      if (!isEmpty(product.promotions)) {
        acc.push(...(product.promotions ?? []));
      }
      return acc;
    },
    []
  );

  // Remove promotions from individual products to avoid duplication
  const cleanProducts = map(products, product => {
    const { promotions: _promotions, ...rest } = product;
    return rest;
  });

  const data: Record<string, any> = {
    category_slug: "new_contract",
    products: cleanProducts
  };

  // Add promotions at root level if any exist
  if (!isEmpty(promotions)) data.promotions = promotions;
  // ---
  // Conditional data
  // add currency if available
  if (currencyCode.value) data.currency_code = currencyCode.value;

  // add tracking if available
  await getTracking()
    .then(values => (data.tracking = values))
    .catch(() => null);

  // ---
  return post<IBasket>({
    mutationKey: ["basket", "products", "add"],
    url: useUrl("orders"),
    data,
    withAccessToken: true
  })
    .then(data => {
      if (isNil(data)) {
        throw new DetailedError(
          t("error.basket_not_available"),
          responseCodes.Internal_Server_Error,
          ErrorOrigin.Headless
        );
      }

      // NB this is critical for any existing items in the queue to have the correct basket id
      forEach(queue.store.state.items, item => {
        if (item.data && !item.data.basketId) {
          item.data.basketId = data.id;
        }
      });

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
async function update({
  basketId,
  model,
  baseModel
}: {
  basketId: string;
  model: ProductProps;
  baseModel?: ProductProps;
}): Promise<IBasket> {
  const { t } = useI18n();
  const { put, post, useUrl } = useQuery();

  if (isEmpty(model))
    throw new DetailedError(
      t("error.product_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );

  const isNew = !model?.id;

  const product = parseBasketProductData(
    reconcileProvisionFields(model, baseModel),
    isNew
  );

  // ---

  if (!basketId) return generateBasket([product]);

  // ---

  const action = isNew ? post : put;
  const suffix = isNew ? "" : `/${model.id}`;

  return action<IBasket>({
    mutationKey: ["basket", "products", isNew ? "add" : model.id],
    url: useUrl(`/orders/${basketId}/products${suffix}`),
    data: product,
    withAccessToken: true
  })
    .then(data => {
      if (isNil(data)) {
        throw new DetailedError(
          t("error.basket_not_available"),
          responseCodes.Internal_Server_Error,
          ErrorOrigin.Headless
        );
      }
      return data;
    })
    .catch(parseApiErrors);
}

/**
 * Add/Update Many basket with new valid products and existing products.
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
async function updateMany({
  basketId,
  basketProducts,
  models
}: {
  basketId: IBasket["id"];
  basketProducts: BasketProduct[];
  models: ProductProps[];
}): Promise<IBasket> {
  const { t } = useI18n();

  if (!basketId)
    throw new DetailedError(
      t("error.basket_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );

  // When updating the basket we need to provide :
  //   * ALL products configurations that need to be added
  //   * ALL other existing products already in the basket
  // otherwise the existing products will be removed from the basket

  // --- then build the basket config for the validItems products
  const newProducts = map(models, item => {
    const product = parseBasketProductData(item);

    // Add a flag to the product to indicate that the field values should NOT be validated.
    //  we want to ge these products in without deep validation
    set(product, "provision_field_values_validate", false);

    return product;
  });

  // --- then build the minimal basket config for the existing products
  // the existing products dont need to have their full config, just the id
  const existingProducts = reduce(
    basketProducts,
    (result: IBasketProductModel[], item: BasketProduct) => {
      const id = get(item, "id");

      if (id) {
        const product = parseBasketProductData(item.configuration);
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

  const products = concat(
    existingProducts,
    newProducts
  ) as IBasketProductModel[];

  // ---

  if (!basketId) return generateBasket(products);

  // ---
  const { put, useUrl } = useQuery();
  return put<IBasket>({
    mutationKey: ["basket", "products"],
    url: useUrl(`/orders/${basketId}`),
    data: { products },
    withAccessToken: true
  }).catch(error => {
    throw new DetailedError(
      t("error.basket_product_update_failed"),
      responseCodes.Internal_Server_Error,
      ErrorOrigin.Headless,
      error
    );
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
  bpid
}: {
  basketId: string;
  bpid: string;
}): Promise<IBasket> {
  const { t } = useI18n();
  const { del, useUrl } = useQuery();
  if (!bpid)
    throw new DetailedError(
      t("error.basket_product_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    ); // we don't need to make a request as there is no id, must be a new product
  if (!basketId)
    throw new DetailedError(
      t("error.basket_not_available"),
      responseCodes.Not_Found,
      ErrorOrigin.Headless
    );
  // ---
  return del<IBasket>({
    mutationKey: ["basket", "products", bpid],
    url: useUrl(`/orders/${basketId}/products/${bpid}`),
    withAccessToken: true
  }).then(data => {
    if (isNil(data)) {
      throw new DetailedError(
        t("error.basket_not_available"),
        responseCodes.Internal_Server_Error,
        ErrorOrigin.Headless
      );
    }
    return data;
  });
}

/**
 *  Parses API errors from the response and formats them into a more usable structure.
 * @param response
 */
function parseApiErrors(response: ResponseError) {
  if (!response?.data) return Promise.reject(response);
  // rawErrors will return a flattened object path in dot notation, so we need to convert back it to an object
  const rawErrors = unflattenErrors(response.data);
  // Currently we receive errors in 2 ways,
  // 1) Options or Attributes returns an collection of products with errors, we only look at the first ( and usually only )
  // 2) Provision fields returns an object
  if (isArray(rawErrors?.products)) {
    response.data = parseBasketProductError(first(rawErrors?.products));
  } else {
    response.data = parseBasketProductError(rawErrors);
  }

  return Promise.reject(response);
}
// -----------------------------------------------------------------------------
// Resolve handlers - handle side effects (prefresh, dataLayer) after queue operations
// -----------------------------------------------------------------------------

/**
 * Calculates the delta between old and new product state.
 * Uses simple subtraction - no unit price calculations needed.
 * Returns a product representing the net change (for add_to_cart or remove_from_cart).
 */
function calculateProductDelta(
  oldProduct: BasketProduct,
  newProduct: BasketProduct
): { deltaProduct: BasketProduct; isAddition: boolean } {
  const oldQty = oldProduct.configuration?.quantity ?? 0;
  const newQty = newProduct.configuration?.quantity ?? 0;
  const isAddition = newQty > oldQty;

  // Calculate deltas by simple subtraction
  const deltaQty = Math.abs(newQty - oldQty);
  const deltaPrice = Math.abs(
    (newProduct.price?.currentAmount ?? 0) -
      (oldProduct.price?.currentAmount ?? 0)
  );
  const deltaSubtotal = Math.abs(
    (newProduct.price?.configuration?.subtotal ?? 0) -
      (oldProduct.price?.configuration?.subtotal ?? 0)
  );
  const deltaDiscount = Math.abs(
    (newProduct.price?.configuration?.discount ?? 0) -
      (oldProduct.price?.configuration?.discount ?? 0)
  );

  const deltaProduct = {
    ...newProduct,
    configuration: {
      ...newProduct.configuration,
      quantity: deltaQty
    },
    price: {
      ...newProduct.price,
      currentAmount: deltaPrice,
      configuration: {
        ...newProduct.price?.configuration,
        subtotal: deltaSubtotal,
        discount: deltaDiscount
      }
    }
  } as BasketProduct;

  return { deltaProduct, isAddition };
}

/**
 * Handles side effects after an update operation resolves.
 * Fires add_to_cart for truly new products, and uses calculateProductDelta for quantity changes.
 */
function onUpdateResolved(rawBasket: IBasket): IBasket {
  const { prefresh, products } = useBasket();
  const existingProducts: BasketProduct[] = products.value ?? [];

  prefresh(rawBasket);

  const updatedProducts: BasketProduct[] = products.value ?? [];

  // Find products completely removed (existed before, gone now)
  const removedProducts = differenceBy(existingProducts, updatedProducts, "id");

  // Single pass: categorize products into adds and removes
  const { addedItems, removedItems } = reduce(
    updatedProducts,
    (acc, newProduct) => {
      const oldProduct = find(existingProducts, ["id", newProduct.id]);

      if (!oldProduct) {
        // Truly new product - add as-is
        acc.addedItems.push(newProduct);
      } else if (
        oldProduct.configuration?.quantity !==
        newProduct.configuration?.quantity
      ) {
        // Quantity changed - add delta
        const { deltaProduct, isAddition } = calculateProductDelta(
          oldProduct,
          newProduct
        );
        if (isAddition) {
          acc.addedItems.push(deltaProduct);
        } else {
          acc.removedItems.push(deltaProduct);
        }
      }

      return acc;
    },
    {
      addedItems: [] as BasketProduct[],
      removedItems: [...removedProducts] as BasketProduct[]
    }
  );

  // Fire single add_to_cart event with all additions
  if (!isEmpty(addedItems)) {
    useDataLayer()
      .dataLayer({ event: "add_to_cart" })
      .withItems(addedItems)
      .push();
  }

  // Fire single remove_from_cart event with all removals
  if (!isEmpty(removedItems)) {
    useDataLayer()
      .dataLayer({ event: "remove_from_cart" })
      .withItems(removedItems)
      .push();
  }

  return rawBasket;
}

/**
 * Handles side effects after an updateQuantity operation resolves.
 * Uses calculateProductDelta to compute the net change between old and new product.
 */
function onUpdateQuantityResolved(
  rawBasket: IBasket,
  oldBasketProduct: BasketProduct
): IBasket {
  const { prefresh, findProduct } = useBasket();
  prefresh(rawBasket);

  // Get the updated product from the refreshed basket (has correct pricing from BE)
  const newBasketProduct = findProduct({ id: oldBasketProduct.id });

  if (newBasketProduct) {
    const { deltaProduct, isAddition } = calculateProductDelta(
      oldBasketProduct,
      newBasketProduct
    );
    const event = isAddition ? "add_to_cart" : "remove_from_cart";

    useDataLayer().dataLayer({ event }).withItems([deltaProduct]).push();
  }

  return rawBasket;
}

/**
 * Handles side effects after a remove operation resolves.
 * Fires remove_from_cart dataLayer event (with product captured before removal) then refreshes.
 */
function onRemoveResolved(
  rawBasket: IBasket,
  bpid: BasketProduct["id"]
): IBasket {
  const { findProduct, prefresh } = useBasket();
  const basketProduct = findProduct({ id: bpid });

  // Fire dataLayer event first (before prefresh since product will be gone)
  if (basketProduct) {
    useDataLayer()
      .dataLayer({ event: "remove_from_cart" })
      .withItems([basketProduct])
      .push();
  }

  prefresh(rawBasket);
  return rawBasket;
}

// -----------------------------------------------------------------------------

export default {
  fetch,
  fetchSelected,
  fetchRelated,
  // ---
  update: async (
    basketId: IBasket["id"] | undefined | null,
    model: ProductProps,
    baseModel?: ProductProps
  ): Promise<IBasket> => {
    return new Promise((resolve, reject) =>
      queue.addItem({
        type: "UPDATE",
        data: { basketId, model, baseModel },
        resolve: (rawBasket: IBasket) => resolve(onUpdateResolved(rawBasket)),
        reject
      })
    );
  },

  updateMany: async (
    basketId: IBasket["id"] | undefined | null,
    basketProducts: BasketProduct[],
    models: ProductModel[]
  ): Promise<IBasket> => {
    return new Promise((resolve, reject) =>
      queue.addItem({
        type: "UPDATE_MANY",
        data: { basketId: basketId!, models, basketProducts },
        resolve: (rawBasket: IBasket) => resolve(onUpdateResolved(rawBasket)),
        reject
      })
    );
  },

  updateQuantity: async (
    basketId: IBasket["id"],
    quantity: number,
    basketProduct: BasketProduct
  ): Promise<IBasket> => {
    return new Promise((resolve, reject) =>
      queue.addItem({
        type: "UPDATE_QUANTITY",
        data: { basketId: basketId!, quantity, basketProduct },
        resolve: (rawBasket: IBasket) =>
          resolve(onUpdateQuantityResolved(rawBasket, basketProduct)),
        reject
      })
    );
  },

  remove: async (
    basketId: IBasket["id"],
    bpid: IBasket["id"]
  ): Promise<IBasket> => {
    return new Promise((resolve, reject) =>
      queue.addItem({
        type: "REMOVE",
        data: { basketId, bpid },
        resolve: (rawBasket: IBasket) =>
          resolve(onRemoveResolved(rawBasket, bpid)),
        reject
      })
    );
  }
};
