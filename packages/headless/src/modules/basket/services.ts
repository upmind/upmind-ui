// --- external

// --- internal
import { useApi } from "../api";
import { useBrand } from "../brand";

import { useSession } from "../session";

// --- utils
import { useCookies, useTracking } from "../../utils";
import { getTokenfromStorage, dumpTokenFromStorage } from "../session/utils";

import { compact, concat, forEach, isEmpty, map, reduce, set } from "lodash-es";

// --- types
import type { IBasket } from "@upmind-automation/types";
import type { BasketContext } from "./types";
import type { AnyEventObject } from "xstate";

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data
// this will process the request and return a promise

async function load({ controller }: BasketContext, _event: AnyEventObject) {
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

  // We depend on the brand being ready, so we need to wait for it
  const { isReady } = useBrand();
  await isReady().catch(error => Promise.reject(error));

  // finally return a the basket with all the relevant data, include the provisioning fields
  return get({
    url: useUrl("orders/current", {
      with: [
        "address",
        "address.country",
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
        "products.product.related",
        "products.product.category",
        // "status",
        // `products.product.category${".top_category".repeat(4)}`,
      ].join(),
    }),
    init: { signal: controller?.signal },
    withAccessToken: true,
    useCache: false,
  })
    .then(({ data }: any) => data)
    .then(getProvisioningFieldsValues);
}

// this generates an empty basket!
async function generate(
  { basket, actors }: BasketContext,
  _event: AnyEventObject
) {
  // safety check, if we have a basket, we dont need to generate one
  if (!isEmpty(basket)) return Promise.resolve(basket);

  const { post, useUrl } = useApi();
  const { getTracking } = useTracking();

  const data: any = {
    category_slug: "new_contract",
  };
  // ---
  // Conditional data
  // add currency if available
  const { validateCurrency } = useBrand();
  const currency = await validateCurrency(
    actors?.currency?.getSnapshot()?.context?.model
  );

  if (currency?.code) data.currency_code = currency.code;

  // add tracking if available
  await getTracking()
    .then(values => (data.tracking = values))
    .catch(() => null);

  // ---

  return post({
    url: useUrl("orders"),
    withAccessToken: true,
    data,
  }).then(({ data }: any) => data);
}

async function convert({ basket }: BasketContext, { data }: AnyEventObject) {
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
    url: useUrl(`/orders/${basket?.id}/convert`),
    withAccessToken: true,
    data,
  }).then(({ data }: any) => data);
}

async function getProvisioningFieldsValues(basket: IBasket) {
  const { get, patch, useUrl } = useApi();

  // bail if we have no basket, or if we have a basket with products
  if (!basket || isEmpty(basket?.products)) return Promise.resolve(basket);

  const provisioningPromises: any[] = [];

  // Start with a promise to check the baskets provisioning fields for errors
  const checkPromise = patch({
    url: useUrl(`orders/${basket.id}/provision_fields/values/check`),
    useCache: false,
    withAccessToken: true,
  })
    .then(({ data }: any) => data)
    .catch(({ error }) => error);

  provisioningPromises.push(checkPromise);

  // then get each products provisioning fields
  // this will get all our provisioning fields for each product that has them,
  // and update the baskets relevant products with the values
  forEach(basket.products, async rawProduct => {
    const { id } = rawProduct;

    const subProducts = compact(
      map(concat(rawProduct.options, rawProduct.attributes), "product_id")
    );

    // we dont cache provisioning fields, as they can change with diferent options/attributes being selected
    const promise = get({
      url: useUrl(
        `orders/${basket.id}/products/${id}/provision_fields/values`,
        {
          sub_product_ids: subProducts,
        }
      ),
      useCache: false,
      withAccessToken: true,
    }).then(({ data }: any) => {
      // update the product with the provisioning fields
      set(rawProduct, "provision_fields", data);
      return data;
    });

    provisioningPromises.push(promise);
  });

  // return the 'updated' basket once all the provisioning fields have been fetched
  return Promise.all(provisioningPromises).then(([rawErrors]) => {
    // rawErrors will return  a flattened ovhect path in dot notation, so we need to convert back it to an object
    const { products: parsedErrors } = reduce(
      rawErrors?.data,
      (result, value, key) => {
        set(result, key, value);
        return result;
      },
      {}
    ) as any;

    // then we parse the errors into a more usable format, replacing their indexes with the product ids
    // this will allow us to easily access the provisioning fields for each product
    const provisioningErrors = reduce(
      parsedErrors,
      (result, value, key: number) => {
        const bpid = basket.products[key]?.id;
        set(result, bpid, value?.provision_field_values);
        return result;
      },
      {}
    );
    return {
      basket,
      provisioningErrors,
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
  authSubscription: (context: any, event: any) =>
    useSession().authSubscription(context, event),
  isAuthenticated: () => useSession().isAuthenticated(),
};
