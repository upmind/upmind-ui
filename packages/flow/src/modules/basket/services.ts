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

async function load(_context?: BasketContext, _event?: BasketEvent) {
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

  return post({
    url: useUrl("orders"),
    withAccessToken: true,
    data: {
      category_slug: "new_contract",
      // currency_code: "GBP", // from brand
      // pricelist_id: "9320e435-795e-78d1-84ce-1643202d9860", // from brand
    },
  }).then(({ data }) => data);
}

async function update({ basket, items }: BasketContext, _event: BasketEvent) {
  if (!has(basket, "id")) return Promise.reject("No basket provided/available");

  const { put, useUrl } = useApi();

  const validItems = filter(items, item => item.state.matches("configured"));
  const productConfigs = map(validItems, item => item.state.context.config);
  // get returns a promise so we can pass it directly back to the machine

  return new Promise((resolve, reject) => {
    put({
      url: useUrl(`/orders/${basket.id}`),
      data: {
        products: productConfigs,
      },
      withAccessToken: true,
    })
      .then(({ data }) => data)
      .then(basket => {
        const newItems = differenceBy(basket.products, validItems, "id");
        return { basket, items: validItems, newItems };
      })
      .then(updateItemProvisioningFields)
      .then(resolve)
      .catch(err => {
        // pass the basket, items, newItems to the error
        // as we may stll need to process them despite the error
        // if they have not already been set by a previous error
        // we will set them here with the current basket, items, NO newItems
        const newItems = differenceBy(basket.products, validItems, "id");
        merge(err, { basket, items: validItems, newItems });
        reject(err);
      });
  });
}

async function refresh({ items }: BasketContext, _event: BasketEvent) {
  const validItems = reject(items, item => item.state.context.isNew);

  // get returns a promise so we can pass it directly back to the machine
  return load().then(basket => {
    const newItems = differenceBy(basket.products, validItems, "id");
    return { basket, items: validItems, newItems };
  });
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

// --------------------------------------------------------

// --- Basket Item Methods

// this function effectively processes the items 1 at a time
// to achieve this we simply take the 1st  item and process it
// and then return the  new basket AND the internal id/machine of the item that was processed

async function updateItem({ basket, items }, { data }: BasketEvent) {
  if (!has(basket, "id")) return Promise.reject("No basket provided/available");

  const item = find(items, ["id", data.itemId]);

  if (!item) return Promise.reject(`No such item : ${data.itemid}`);

  const isNew = get(item.state, "context.isNew");
  const config = get(item.state, "context.config");

  const { put, post, useUrl } = useApi();
  const action = isNew ? post : put;
  const suffix = isNew ? "" : `/${item.id}`;

  return new Promise((resolve, reject) => {
    action({
      url: useUrl(`/orders/${basket.id}/products${suffix}`),
      data: config,
      withAccessToken: true,
    })
      .then(({ data }) => data)
      .then(basket => {
        const newItems = differenceBy(basket.products, items, "id");
        return { basket, items: [item], newItems };
      })
      .then(updateItemProvisioningFields)
      .then(resolve)
      .catch(err => {
        // pass the basket, items, newItems  to the error
        // as we may stll need to process them despite the error
        // if they have not already been set by a previous error
        // we will set them here with the current basket, items, NO newItems
        const newItems = differenceBy(basket.products, items, "id");
        merge(err, { basket, items: [item], newItems });
        return reject(err);
      });
  });
}

async function updateItemProvisioningFields({ basket, items, newItems }) {
  const { put, useUrl } = useApi();

  // bail if we have no basket, or if we have a basket without products
  if (!basket?.products?.length)
    return Promise.resolve({ basket, items, newItems });

  const promises = reduce(
    items,
    (result, item, index) => {
      // If we are editing a single item, then we can get the product from the item
      // If we are adding a single item,
      // or we have done a bulk update, which replaces ALL the items with new ids
      // so then we can get the product from the newItems at the same index

      let product = find(basket.products, ["id", item.id]);
      product ??= get(newItems, index);

      const hasProvisioning = !!get(
        item.state.context,
        "lookups.product.provision_blueprint_id"
      );

      // if the product has no provisioning fields, we dont need to make a request
      if (!product || !hasProvisioning) return result;

      const provision_field_values =
        item.state.context.config.provision_field_values;

      const promise = put({
        url: useUrl(
          `/orders/${basket.id}/products/${product.id}/provision_fields/values`
        ),
        data: { provision_field_values },
        withAccessToken: true,
      }).then(({ data }) => {
        // update the product with the provisioning fields, before returning the basket
        set(product, ["provision_fields"], data);
      });

      result.push(promise);
      return result;
    },
    []
  );

  return new Promise((resolve, reject) => {
    Promise.all(promises)
      .then(() => ({ basket, items, newItems }))
      .then(resolve)
      .catch(err => {
        // pass the basket, items, newItems  to the err
        // as we may stll need to process them despite the err
        err.basket = basket;
        err.items = items;
        err.newItems = newItems;

        return reject(err);
      });
  });
}

async function removeItem({ basket, bin }: BasketContext, _event: BasketEvent) {
  if (!has(basket, "id")) return Promise.reject("No basket provided/available");

  const item = first(bin);

  const isNew = get(item.state, "context.isNew");

  if (isNew) return Promise.resolve({ itemId: item.id }); // we dont need to make a request

  const { del, useUrl } = useApi();
  return del({
    url: useUrl(`/orders/${basket.id}/products/${item.id}`),
    withAccessToken: true,
  })
    .then(({ data }) => ({ basket: data, itemId: item.id }))
    .catch(() => ({ itemId: item.id }));
}

async function getProvisioningFieldsValues(basket: BasketEvent) {
  const { get, useUrl } = useApi();

  // bail if we have no basket, or if we have a basket with products
  if (!basket || !basket?.products?.length) return Promise.resolve(basket);

  const { id: basket_id, products } = basket;

  const provisioningPromises = [];

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
  return Promise.all(provisioningPromises).then(() => basket);
}

// --------------------------------------------------------
// EXPORTS

export default {
  load,
  generate,
  update,
  refresh,
  convert,
  // ---
  updateItem,
  removeItem,
  // ---
  authSubscription: (context, event) =>
    useSession().authSubscription(context, event),
  isAuthenticated: () => useSession().isAuthenticated(),
};
