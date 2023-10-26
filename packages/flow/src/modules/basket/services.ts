// --- external

// --- internal
import { useApi } from "../api";
import type { BasketContext } from "./types.d";
import { useSession } from "../session";
import type { Token } from "../session/types.d";
const { authSubscription, getHistory, isAuthenticated, service } = useSession();

// --- utils
import { useBasketParser } from "./utils";
import { isEmpty, first, isObject, isArray, filter, has } from "lodash-es";

// --------------------------------------------------------
// ENUMS

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
  }).then(useBasketParser);
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

// --- Basket Methods

// this function effectively processes the queu of items 1 at a time
// to achieve this we simply take the 1st configured item and add it to the basket
// and then return the  new basket AND the internal id/machine of the item that was added
async function addToBasket({ basket, items }, event: any) {
  if (!has(basket, "id")) return Promise.reject("No basket provided/available");

  const item = first(
    filter(items, ({ state }) => {
      const isConfigured = state.matches("configured");
      const isNew = !has(state, "context.config.id");
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
    .then(({ data }) => ({ basket: data, itemId: item.id }))
    .catch(error => ({ error, itemId: item.id }));
}

async function removeFromBasket({ basket, bin }: BasketContext, _event: any) {
  if (!has(basket, "id")) return Promise.reject("No basket provided/available");

  const item = first(bin);
  const isNew = !has(item.state, "context.config.id");

  if (isNew) return Promise.resolve({ itemId: item.id }); // we dont need to make a request

  const { del, useUrl } = useApi();
  return del({
    url: useUrl(`/orders/${basket.id}/products/${item.id}`),
    withAccessToken: true
  })
    .then(({ data }) => ({ basket: data, itemId: item.id }))
    .catch(error => ({ error, itemId: item.id }));
}

async function update(context: BasketContext, _event: any) {}

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
  // ---
  addToBasket,
  removeFromBasket,
  // ---
  authSubscription,
  isAuthenticated
};
