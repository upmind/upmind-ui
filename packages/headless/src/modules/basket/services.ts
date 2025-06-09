// --- external

// --- internal
import { useBrand } from "../brand";
import { useQuery } from "../..";
import { useSession } from "../session";
import { useTracking } from "../system";

// --- utils
import { unflattenErrors, useCookies } from "../../utils";
import { parseBasketProductError } from "../basketProduct/utils";
import { getTokenFromStorage, dumpTokenFromStorage } from "../session/utils";

import {
  compact,
  concat,
  forEach,
  isEmpty,
  isNil,
  map,
  omitBy,
  reduce,
  set,
} from "lodash-es";

// --- types
import type { IBasket } from "@upmind-automation/types";
import type { BasketContext } from "./types";
import type { AnyEventObject } from "xstate";

// ---  UTILS

// -----------------------------------------------------------------------------

async function load(context: BasketContext, _event: AnyEventObject) {
  const { getAsync, patch, useUrl } = useQuery();

  // check if we are logged in as a client
  // then try to get any previous guest token a
  const client_token = getTokenFromStorage("client");
  const guest_token = getTokenFromStorage("guest");

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

  // finally return a basket with all the relevant data, include the provisioning fields
  // NB  we DON'T cache the current basket as it can change frequently, and it is the source of truth
  // for the current state of the basket
  return getAsync<IBasket>({
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
        `products.product.category${".top_category".repeat(4)}`,
      ].join(),
    }),
    init: { signal: context.controller?.signal },
    queryKey: ["basket", "current"],
    staleTime: 0, // disable cache, this may still return stale data while the request is in flight
    gcTime: 0, // force cache to be cleared immediately, to prevent stale data
    withAccessToken: true,
    //revalidateIfStale: true,
  })
    .then((data: any) => {
      // generate a new basket if we don't have one;
      if (isEmpty(data)) return generate(context, { type: "GENERATE" });
      return data;
    })
    .then(getProvisioningFieldsValues);
}

// this generates an empty basket!
async function generate({ actors }: BasketContext, _event: AnyEventObject) {
  const { post, useUrl } = useQuery();
  const { get: getTracking } = useTracking();

  const data: Record<string, any> = {
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
  });
}

async function convert(
  { basket, paymentDetails }: BasketContext,
  _event: AnyEventObject
) {
  const { patch, useUrl } = useQuery();
  const { get: getCookie } = useCookies();
  const { get: getTracking } = useTracking();

  if (!basket?.id) return Promise.reject(new Error("No basket to convert"));
  if (!paymentDetails) return Promise.reject(new Error("No data to convert"));

  const data = paymentDetails;

  // add referral cookie if available
  const referralCookie = getCookie("upm_aff");
  if (referralCookie) data.referral_cookie = referralCookie;

  // add tracking if available
  data.tracking = await getTracking().catch(() => undefined);

  // ---
  // this will return an array of the users baskets, ordered by most recent
  // but the response basket does not contain the products, so we need to
  // request the basket by id to get the products?
  return patch({
    url: useUrl(`/orders/${basket?.id}/convert`),
    withAccessToken: true,
    data: omitBy(data, isNil), // NB we need to remove any null values
  });
}

async function getProvisioningFieldsValues(basket: IBasket) {
  const { getAsync, patch, useUrl } = useQuery();

  // bail if we have no basket, or if we have a basket with products
  if (!basket || isEmpty(basket?.products)) return Promise.resolve(basket);

  const provisioningPromises: Promise<any>[] = [];

  // Start with a promise to check the baskets provisioning fields for errors
  const checkPromise = patch({
    url: useUrl(`orders/${basket.id}/provision_fields/values/check`),
    withAccessToken: true,
  }).catch(({ error }) => error);

  provisioningPromises.push(checkPromise);

  // then get each product provisioning fields
  // this will get all our provisioning fields for each product that has them,
  // and update the baskets relevant products with the values
  forEach(basket.products, async rawProduct => {
    const { id } = rawProduct;

    const subProducts = compact(
      map(concat(rawProduct.options, rawProduct.attributes), "product_id")
    );

    // we don't cache provisioning fields, as they can change with different options/attributes being selected
    const promise = getAsync({
      url: useUrl(
        `orders/${basket.id}/products/${id}/provision_fields/values`,
        {
          sub_product_ids: subProducts,
        }
      ),
      queryKey: [
        "basket",
        basket.id,
        "products",
        id,
        "provision_fields",
        "values",
      ],
      withAccessToken: true,
      staleTime: 0, // disable cache, this may still return stale data while the request is in flight
      gcTime: 0, // force cache to be cleared immediately, to prevent stale data
    }).then(data => {
      // update the product with the provisioning fields
      set(rawProduct, "provision_fields", data);
      return data;
    });

    provisioningPromises.push(promise);
  });

  // return the 'updated' basket once all the provisioning fields have been fetched
  return Promise.all(provisioningPromises)
    .then(([data]) => {
      // rawErrors will return a flattened object path in dot notation, so we need to convert back it to an object
      // and then we 'pick' the products out of the object
      const { products: rawErrors } = unflattenErrors(data?.data);
      // then we parse the errors into a more usable format, replacing their indexes with the product ids
      // this will allow us to easily access the provisioning fields for each product
      const errors = reduce(
        rawErrors,
        (result, value, key: number) => {
          const bpid = basket.products[key]?.id;
          if (!bpid) return result;
          return set(result, bpid, parseBasketProductError(value));
        },
        {}
      );

      return {
        basket,
        errors,
      };
    })
    .catch(error => {
      return {
        basket,
        errors: error,
      };
    });
}
// -----------------------------------------------------------------------------

export default {
  load,
  refresh: load,
  convert,
  isAuthenticated: () => useSession().isAuthenticated(),
};
