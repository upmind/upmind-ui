// --- external

// --- internal
import { useApi } from "../../..";
import { useBrand } from "../../brand";

// --- utils
import { useTime } from "../../../utils";
import { parseBasketProductConfig } from "./utils";

import {
  compact,
  concat,
  filter,
  forEach,
  get,
  isEmpty,
  map,
  reduce,
  set,
} from "lodash-es";

// --- types

// --------------------------------------------------------

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

// --------------------------------------------------------

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
  const { get: getRequest, useUrl } = useApi();

  const params = {
    currency_id: currency.id,
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

  return getRequest({
    url: useUrl(`basket/products/${productId}`, params),
    useCache: true,
    maxAge: useTime()?.DAY, // product data is not updated often, so we can cache for a day
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

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

  // lets ensure we have a valid currency > fallback to default
  const currency = await useBrand().validateCurrency({ id: currencyId });
  // ---
  const { get: getRequest, useUrl } = useApi();

  const params = {
    currency_id: currency.id,
    promotions: (promotions ?? []).join(","), // ensure we pass any applied promotions to get the correct prices
    "filter[id]": productIds.join(","),
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

  return getRequest({
    url: useUrl(`basket/products/`, params),
    useCache: true,
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

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
  const { get: getRequest, useUrl } = useApi();

  const params = {
    currency_id: currency.id,
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

  return getRequest({
    url: useUrl(`basket/products/${productId}/related`, params),
    useCache: true,
    maxAge: useTime()?.DAY, // product data is not updated often, so we can cache for a day
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

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
  { data }: any
) {
  const { put, post, useUrl } = useApi();
  if (!basketId) return Promise.reject("No basket provided/available");
  if (isEmpty(data)) return Promise.reject(`No product data provided`);

  const product = parseBasketProductConfig(data, promotions);
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

async function remove({ basketId, bpid }: { basketId: string; bpid: string }) {
  const { del, useUrl } = useApi();
  if (!basketId) return Promise.reject("No basket provided/available");
  if (!bpid) return Promise.resolve(); // we dont need to make a request as there is no id, must be a new product
  // ---
  return del({
    url: useUrl(`/orders/${basketId}/products/${bpid}`),
    withAccessToken: true,
  }).then(({ data }: any) => data);
}

async function sync(
  { basketId, basketProducts, promotions }: any,
  { data }: any
) {
  if (!basketId) return Promise.reject("No basket provided/available");

  // When updating the basket we need to provide :
  //   * ALL products that are valid and ready to be saved
  //   * ALL other existing products already in the basket
  // otherwise the existing products will be removed from the basket

  const validItems = filter(data, item =>
    item.state?.matches("available.valid")
  );

  // --- then build the basket config for the validItems products
  const products = map(validItems, item => {
    const id = get(item, "state.context.basketProduct.id");
    // inform the item that it is being processed
    item.send({ type: "PROCESSING" });
    // ---
    const model = get(item, "state.context.model");
    if (!model) return Promise.reject("No model found");
    // ---
    const product = parseBasketProductConfig(model, promotions);
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
        const product = parseBasketProductConfig(item, promotions);
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
  const { put, useUrl } = useApi();
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

// --------------------------------------------------------
// EXPORTS

export default {
  fetch,
  fetchSelected,
  fetchRelated,
  update,
  remove,
  sync,
};
