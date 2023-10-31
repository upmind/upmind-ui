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
  isEmpty,
  first,
  get,
  set,
  find,
  filter,
  has,
  forEach,
  differenceBy
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

async function getProvisioningFieldsValues(basket: any) {
  const { get, useUrl } = useApi();
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

// --- Basket Item Methods

// this function effectively processes the items 1 at a time
// to achieve this we simply take the 1st  item and process it
// and then return the  new basket AND the internal id/machine of the item that was processed

async function addItem({ basket, items }, event: any) {
  if (!has(basket, "id")) return Promise.reject("No basket provided/available");

  const item = first(
    filter(items, ({ state }) => {
      const isConfigured = state.matches("configured");
      const isNew = get(state, "context.isNew");
      return isConfigured && isNew;
    })
  );

  if (!item) return Promise.reject("No item to add to basket");

  const config = item.state.context.config;

  const { post, useUrl } = useApi();
  return post({
    url: useUrl(`/orders/${basket.id}/products`),
    data: config,
    withAccessToken: true
  })
    .then(useBasketParser)
    .then(basket => {
      const newItems = differenceBy(basket.products, items, "id");

      // should only be 1 new item, but lets warn if there is more
      if (newItems.length > 1) {
        console.warn(
          `More than 1 new item was added to the basket, this is unexpected`,
          { newItems }
        );
      }
      // ge the id of the new item
      const { id } = first(newItems);
      item.newId = id;
      return { basket, item, id }; // override the id of the new item that was added
    })
    .then(updateItemProvisioningFields)
    .then(basket => ({ basket, itemId: item.id, newId: item.newId }))
    .catch(error => ({ error, itemId: item.id }));
}

async function updateItem({ basket, items }, _event: any) {
  if (!has(basket, "id")) return Promise.reject("No basket provided/available");

  const item = first(
    filter(items, ({ state }) => {
      const isConfigured = state.matches("configured");
      const isDirty = get(state, "context.isDirty");
      const isNew = get(state, "context.isNew");
      return isConfigured && !isNew & isDirty;
    })
  );

  if (!item) return Promise.reject("No item to add to basket");

  const config = item.state.context.config;

  const { put, useUrl } = useApi();

  return put({
    url: useUrl(`/orders/${basket.id}/products/${item.id}`),
    data: config,
    withAccessToken: true
  })
    .then(useBasketParser)
    .then(basket => ({ basket, item, id: item.id }))
    .then(updateItemProvisioningFields)
    .then(basket => ({ basket, itemId: item.id }))
    .catch(error => ({ error, itemId: item.id }));
}

async function updateItemProvisioningFields({ basket, item, id }) {
  const { put, useUrl } = useApi();

  const product = find(basket.products, ["id", id]);
  const provision_field_values =
    item.state.context.config.provision_field_values;

  const hasProvisioning = !!get(item.state.context, [
    "available",
    "product",
    "provision_blueprint_id"
  ]);

  // if the product has no provisioning fields, we dont need to make a request
  if (!hasProvisioning) return Promise.resolve(basket);

  return put({
    url: useUrl(`/orders/${basket.id}/products/${id}/provision_fields/values`),
    data: { provision_field_values },
    withAccessToken: true
  }).then(({ data }) => {
    // update the product with the provisioning fields, before returning the basket
    set(product, ["provision_fields"], data);
    return basket;
  });
}

async function removeItem({ basket, bin }: BasketContext, _event: any) {
  if (!has(basket, "id")) return Promise.reject("No basket provided/available");

  const item = first(bin);
  const isNew = get(item.state, "context.isNew");

  if (isNew) return Promise.resolve({ itemId: item.id }); // we dont need to make a request

  const { del, useUrl } = useApi();
  return del({
    url: useUrl(`/orders/${basket.id}/products/${item.id}`),
    withAccessToken: true
  })
    .then(({ data }) => ({ basket: data, itemId: item.id }))
    .catch(error => ({ error, itemId: item.id }));
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
  getProvisioningFieldsValues,
  // ---
  addItem,
  updateItem,
  removeItem,
  // ---
  authSubscription,
  isAuthenticated
};
