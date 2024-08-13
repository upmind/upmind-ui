// --- external

// --- internal
import { useApi } from "../api";

import type { BasketContext, BasketEvent } from "./types.d";
import { useSession } from "../session";

// --- utils
import { useCookies, useTracking } from "../../utils";
import { getTokenfromStorage, dumpTokenFromStorage } from "../session/utils";

import {
  compact,
  concat,
  differenceBy,
  filter,
  find,
  first,
  forEach,
  get,
  has,
  isEmpty,
  map,
  merge,
  reduce,
  reject,
  set,
} from "lodash-es";

// --------------------------------------------------------
// ENUMS

export enum SemanticTypes {
  DOMAIN_NAMES = "domain_name",
}

export enum InvoiceStatus {
  ADJUSTED = "invoice_adjusted",
  CANCELLED = "invoice_cancelled",
  DRAFT = "invoice_draft",
  OVERDUE = "invoice_overdue",
  PAID = "invoice_paid",
  REFUNDED = "invoice_refunded",
  REPLACED = "invoice_replaced", // Only on imported invoices
  UNPAID = "invoice_unpaid",
  CANCELLATION_REQUEST = "invoice_cancellation_request",
}

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise

async function load({ controller }?: BasketContext, _event?: BasketEvent) {
  const { get, patch, useUrl } = useApi();

  // check if we are logged in as a client
  // then try get any previous guest token a
  const client_token = getTokenfromStorage("client");
  const guest_token = getTokenfromStorage("guest");

  // if we are a client AND we have a guest token, we need to claim the basket
  if (client_token && guest_token) {
    await patch({
      url: useUrl("orders/claim"),
      withAccessToken: true,
      data: {
        guest_token: guest_token.access_token,
      },
    }).then(() => {
      // because we have successfully claimed the basket, we can dump the guest token
      // we only do it here, as we may need to claim the basket again if something went wrong
      dumpTokenFromStorage("guest");
    });
  }

  // finally return a the basket with all the relevant data, include the provisioning fields
  return get({
    url: useUrl("orders/current", {
      with: [
        "currency",
        "custom_fields.field",
        "promotions",
        "taxes",
        "taxes.tax_tag_data",
        // "account.brand.image",
        // "account.pricelist",
        // "brand.image",
        // "client.image",
        // "contract",
        // "payments",
        "products.product.image",
        "products.product.images",
        "products.product.prices",
        "products.product.products_attributes",
        "products.product.products_attributes.category",
        "products.product.products_options",
        "products.product.products_options.category",
        "products.product.products_options.prices",
        "products.product.provision_field_values",
        "products.tags",
        // "status",
        // `products.product.category${".top_category".repeat(4)}`,
      ].join(),
    }),
    init: { signal: controller?.signal },
    withAccessToken: true,
    useCache: false,
  })
    .then(({ data }) => data)
    .then(getProvisioningFieldsValues);
}

// this generates an empty basket!
async function generate({ basket }: BasketContext, _event: BasketEvent) {
  // safety check, if we have a basket, we dont need to generate one
  if (!isEmpty(basket)) return Promise.resolve(basket);

  const { post, useUrl } = useApi();
  const { getTracking } = useTracking();

  const data = {
    category_slug: "new_contract",
    // currency_code: "GBP", // from brand
    // pricelist_id: "9320e435-795e-78d1-84ce-1643202d9860", // from brand
  };
  // ---
  // Conditional data

  // add tracking if available
  await getTracking()
    .then(values => (data.tracking = values))
    .catch(() => null);

  // ---

  return post({
    url: useUrl("orders"),
    withAccessToken: true,
    data,
  }).then(({ data }) => data);
}

async function convert({ basket }: BasketContext, { data }: BasketEvent) {
  const { patch, useUrl } = useApi();
  const { getCookie } = useCookies();
  const { getTracking } = useTracking();
  // ---
  // Conditional data

  // add referral cookie if available
  await getCookie("upm_aff")
    .then(value => (data.referral_cookie = value))
    .catch(() => null);

  // add tracking if available
  await getTracking()
    .then(values => (data.tracking = values))
    .catch(() => null);

  // ---
  // this will return an array of the users baskets, ordered by most recent
  // but the response basket does not contain the products, so we need to
  // request the basket by id to get the products?
  return patch({
    url: useUrl(`/orders/${basket.id}/convert`),
    withAccessToken: true,
    data,
  }).then(({ data }) => data);
}

async function getProvisioningFieldsValues(basket: BasketEvent) {
  const { get, patch, useUrl } = useApi();

  // bail if we have no basket, or if we have a basket with products
  if (!basket || !basket?.products?.length) return Promise.resolve(basket);

  const { id: basket_id, products } = basket;

  const provisioningPromises = [];

  // Start with a promise to check the baskets provisioning fields for errors
  const checkPromise = patch({
    url: useUrl(`orders/${basket_id}/provision_fields/values/check`),
    useCache: false,
    withAccessToken: true,
  })
    .then(({ data }) => data)
    .catch(({ error }) => error);
  provisioningPromises.push(checkPromise);

  // then get each products provisioning fields
  // this will get all our provisioning fields for each product that has them,
  // and update the baskets relevant products with the values
  forEach(products, async product => {
    const { id } = product;

    const sub_products = compact(
      map(concat(product.options, product.attributes), "product_id")
    );
    // we dont cache provisioning fields, as they can change with diferent options/attributes being selected
    const promise = get({
      url: useUrl(
        `orders/${basket_id}/products/${id}/provision_fields/values`,
        {
          sub_product_ids: sub_products,
        }
      ),
      useCache: false,
      withAccessToken: true,
    }).then(({ data }) => {
      // update the product with the provisioning fields
      set(product, "provision_fields", data);
      return data;
    });

    provisioningPromises.push(promise);
  });

  // return the 'updated' basket once all the provisioning fields have been fetched
  return Promise.all(provisioningPromises).then(([provisioningErrors]) => {
    // provisioningErrors will return  a flattened ovhect path in dot notation, so we need to convert back it to an object
    if (has(provisioningErrors, "data")) {
      provisioningErrors.data = reduce(
        provisioningErrors.data,
        (result, value, key) => {
          set(result, key, value);
          return result;
        },
        {}
      );
    }
    return {
      basket,
      error: provisioningErrors,
    };
  });
}
// --------------------------------------------------------
// EXPORTS

export default {
  load,
  generate,
  refresh: load,
  convert,
  // ---
  authSubscription: (context, event) =>
    useSession().authSubscription(context, event),
  isAuthenticated: () => useSession().isAuthenticated(),
};
