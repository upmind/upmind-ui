// --- external

// --- internal
import { useApi } from "../api";
import type { BasketContext } from "./types.d";
import { useSession } from "../session";
import type { Token } from "../session/types.d";
const { authSubscription, getHistory, isAuthenticated, service } = useSession();

// --- utils
import { useBasketParser } from "./utils";
import { isEmpty, first, isObject, isArray } from "lodash-es";

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

async function create(_context: BasketContext, { data }: any) {
  const { post, useUrl } = useApi();

  // we may be passed a product or an array of products to create the basket with...
  // todo: ensure the data payload is a valid product(s)
  const products = [];
  if (isArray(data)) products.push(...data);
  else if (isObject(data)) products.push(data);

  return post({
    url: useUrl("orders"),
    withAccessToken: true,
    data: {
      category_slug: "new_contract",
      // currency_code: "GBP", // from brand
      // pricelist_id: "9320e435-795e-78d1-84ce-1643202d9860", // from brand
      products
      // promotions: []
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

async function dump(_context: BasketContext, _event: any) {
  // do we need to tell the api to dump the basket?
  return Promise.resolve(); // we dont need to return anything
}

// --- Basket Methods

async function add({ basketId, config }, _event: any) {
  const { post, useUrl } = useApi();
  return post({
    url: useUrl(`/orders/${basketId}/products`),
    data: config,
    withAccessToken: true
  });
}

async function update(context: BasketContext, _event: any) {}

async function remove(context: BasketContext, _event: any) {}

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
  create,
  claim,
  dump,
  // ---
  add,
  // ---
  authSubscription,
  isAuthenticated
};
