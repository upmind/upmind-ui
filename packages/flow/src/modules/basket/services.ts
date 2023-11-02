// --- external

// --- internal
import { useApi } from "../api";

import type { BasketContext } from "./types.d";
import { useSession } from "../session";
import type { Token } from "../session/types.d";
const { authSubscription, getHistory, isAuthenticated, service } = useSession();

// --- utils
import { useBasketParser } from "./utils";
import {
  compact,
  differenceBy,
  filter,
  find,
  first,
  forEach,
  get,
  has,
  isEmpty,
  map,
  pick,
  reduce,
  set
} from "lodash-es";

// --------------------------------------------------------
// ENUMS

export enum SemanticTypes {
  DOMAIN_NAMES = "domain_name"
}

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise

async function check(_context: BasketContext, _event: any) {
  const { get, useUrl } = useApi();

  // get returns a promise so we can pass it directly back to the machine
  return await get({
    url: useUrl("orders/current", {
      with: [
        "account.brand.image",
        "account.pricelist",
        "brand.image",
        "client.image",
        "contract",
        "currency",
        "custom_fields.field",
        "payments",
        "products.product.image",
        "products.product.images",
        "products.product.prices",
        "products.product.products_attributes",
        "products.product.products_attributes.category",
        "products.product.products_options",
        "products.product.products_options.category",
        "products.product.products_options.prices",
        // "products.product.provision_field_values",
        "products.tags",
        "promotions",
        "status",
        "taxes",
        "taxes.tax_tag_data",
        `products.product.category${".top_category".repeat(4)}`
      ].join()
    }),
    withAccessToken: true,
    useCache: false
  })
    .then(useBasketParser)
    .then(getProvisioningFieldsValues);
}

// this generates an empty basket!
async function generate({ basket }: BasketContext, _event: any) {
  // safety check, if we have a basket, we dont need to generate one
  if (!isEmpty(basket)) return Promise.resolve(basket);

  const { post, useUrl } = useApi();

  return post({
    url: useUrl("orders"),
    withAccessToken: true,
    data: {
      category_slug: "new_contract"
      // currency_code: "GBP", // from brand
      // pricelist_id: "9320e435-795e-78d1-84ce-1643202d9860", // from brand
    }
  }).then(useBasketParser);
}

async function claim({ basket }: BasketContext, _event: any) {
  if (isEmpty(basket)) return Promise.resolve();

  const { patch, useUrl } = useApi();
  const token: Token | undefined = first(getHistory());
  if (!token) return Promise.resolve();

  // this will return an array of the users baskets, ordered by most recent
  // but the response basket does not contain the products, so we need to
  // request the basket by id to get the products?
  return await patch({
    url: useUrl("orders/claim"),
    withAccessToken: true,
    data: {
      guest_token: token.access_token
    }
  }).then(useBasketParser);
}

async function update({ basket, items }: BasketContext, _event: any) {
  const { put, useUrl } = useApi();

  const validItems = filter(items, item => item.state.matches("configured"));
  const productConfigs = map(validItems, item => item.state.context.config);
  // get returns a promise so we can pass it directly back to the machine
  return put({
    url: useUrl(`/orders/${basket.id}`),
    data: {
      products: productConfigs
    },
    withAccessToken: true
  })
    .then(useBasketParser)
    .then(basket => {
      const newItems = differenceBy(basket.products, validItems, "id");
      return { basket, items: validItems, newItems, queue: false };
    })
    .then(updateItemProvisioningFields);
}

// --- Basket Item Methods

// this function effectively processes the items 1 at a time
// to achieve this we simply take the 1st  item and process it
// and then return the  new basket AND the internal id/machine of the item that was processed

async function updateItem({ basket, items }, { data }: any) {
  if (!has(basket, "id")) return Promise.reject("No basket provided/available");

  let item;
  const queue = !data?.itemId; // by default we will try process all items iteratively
  // if we are explicitly given an item id, we will only process that item
  // and not the whole queue
  if (!queue) {
    item = find(items, ["id", data.itemId]);
  } else {
    item = first(
      filter(items, ({ state }) => {
        const isConfigured = state.matches("configured");
        const isNew = get(state, "context.isNew");
        const isDirty = get(state, "context.isDirty");
        return isConfigured && (isNew || isDirty);
      })
    );
  }

  if (!item) return Promise.reject("No item to add to basket");

  const isNew = get(item.state, "context.isNew");
  const config = get(item.state, "context.config");

  const { put, post, useUrl } = useApi();
  const action = isNew ? post : put;
  const suffix = isNew ? "" : `/${item.id}`;
  return action({
    url: useUrl(`/orders/${basket.id}/products${suffix}`),
    data: config,
    withAccessToken: true
  })
    .then(useBasketParser)
    .then(basket => {
      const newItems = differenceBy(basket.products, items, "id");
      return { basket, items: [item], newItems, queue };
    })
    .then(updateItemProvisioningFields);
}

async function updateItemProvisioningFields({
  basket,
  items,
  newItems,
  queue
}) {
  const { put, useUrl } = useApi();

  // bail if we have no basket, or if we have a basket without products
  if (!basket?.products?.length)
    return Promise.resolve({ basket, items, newItems, queue });
  const promises = reduce(
    items,
    (result, item, index) => {
      // If we are editing a single item, then we can get the product from the item
      // If we are adding a single item,
      // or we have done a bulk update, which replaces ALL the items with new ids
      // so then we can get the product from the newItems at the same index
      let product = find(basket.products, ["id", item.id]);
      product ??= get(newItems, index);

      const hasProvisioning = !!get(item.state.context, [
        "available",
        "product",
        "provision_blueprint_id"
      ]);
      // if the product has no provisioning fields, we dont need to make a request
      if (!product || !hasProvisioning) return result;

      const provision_field_values =
        item.state.context.config.provision_field_values;

      const promise = put({
        url: useUrl(
          `/orders/${basket.id}/products/${product.id}/provision_fields/values`
        ),
        data: { provision_field_values },
        withAccessToken: true
      }).then(({ data }) => {
        // update the product with the provisioning fields, before returning the basket
        set(product, ["provision_fields"], data);
      });

      result.push(promise);
      return result;
    },
    []
  );

  return Promise.all(promises)
    .then(() => ({ basket, items, newItems, queue }))
    .catch(err => {
      // we dont need to throw this error, as it is not critical
      console.error("updateItemProvisioningFields", err, {
        basket,
        items,
        newItems,
        queue
      });
    });
}

async function removeItem({ basket, bin }: BasketContext, { data }: any) {
  if (!has(basket, "id")) return Promise.reject("No basket provided/available");

  let item;
  const queue = !data?.itemId; // by default we will try process all items iteratively

  // if we are explicitly given an item id, we will only process that item
  // and not the whole queue
  if (!queue) {
    item = find(bin, ["id", data.itemId]);
  } else {
    item = first(bin);
  }

  const isNew = get(item.state, "context.isNew");

  if (isNew) return Promise.resolve({ itemId: item.id, queue }); // we dont need to make a request

  const { del, useUrl } = useApi();
  return del({
    url: useUrl(`/orders/${basket.id}/products/${item.id}`),
    withAccessToken: true
  }).then(({ data }) => ({ basket: data, itemId: item.id, queue }));
}

async function getProvisioningFieldsValues(basket: any) {
  const { get, useUrl } = useApi();

  // bail if we have no basket, or if we have a basket with products
  if (!basket || !basket?.products?.length) return Promise.resolve(basket);

  const { id: basketId, products } = basket;

  const provisioningPromises = [];

  // this will get all our provisioning fields for each product that has them,
  // and update the baskets relevant products with the values
  forEach(products, async product => {
    const { id, provision_provider_id } = product;
    if (provision_provider_id) {
      // we dont cache provisioning fields, as they can change with diferent options/attributes being selected
      const promise = get({
        url: useUrl(
          `orders/${basketId}/products/${id}/provision_fields/values`
        ),
        useCache: false,
        withAccessToken: true
      }).then(({ data }) => {
        // update the product with the provisioning fields
        set(product, "provision_fields", data);
        return data;
      });

      provisioningPromises.push(promise);
    }
  });

  // return the 'updated' basket once all the provisioning fields have been fetched
  return Promise.all(provisioningPromises).then(() => basket);
}

// --------------------------------------------------------

async function hideWarnings(context: BasketContext, _event: any) {}

async function convertToInvoice(context: BasketContext, _event: any) {}

// --------------------------------------------------------
// --- Syntax sugar to Update Basket
// --------------------------------------------------------

async function setBasket(context: BasketContext, _event: any) {}

async function setCurrency(context: BasketContext, _event: any) {}

async function setPriceList(context: BasketContext, _event: any) {}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  check,
  generate,
  claim,
  update,
  // ---
  updateItem,
  removeItem,
  // ---
  authSubscription,
  isAuthenticated
};
