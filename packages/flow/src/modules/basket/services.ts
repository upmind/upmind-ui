// --- external

// --- internal
import { useApi } from "../api";
import { type BasketContext } from "./types.d";
import { useSession } from "../session";
const { authSubscription } = useSession();

// --- utils
import { isEmpty, first, isObject, isArray } from "lodash-es";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise

async function check(context: BasketContext, _event: any) {
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
  });
}

async function create(context: BasketContext, { data }: any) {
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
  });
}

async function refresh(context: BasketContext, _event: any) {}

async function claim({ basket }: BasketContext, _event: any) {
  if (isEmpty(basket)) return Promise.resolve();

  const { patch, useUrl } = useApi();
  const { history } = useSession();
  const token = first(history);
  if (isEmpty(token)) return Promise.resolve();
  return await patch({
    url: useUrl("orders/claim"),
    withAccessToken: true,
    data: {
      guest_token: token.access_token
    }
  });
}

// --- Basket Methods
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
  refresh,
  authSubscription,
  claim
  // ---
};
