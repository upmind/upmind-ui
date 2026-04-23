// --- external

// --- internal
import { useBrand } from "../brand";
import { useI18n, useQuery } from "../..";
import { useSession } from "../session";
import { useTracking } from "../system";

// --- utils
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useCookies
} from "../../utils";
import { parseBasketErrors } from "./utils";
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
  set
} from "lodash-es";

// --- types
import {
  BrandConfigKeys,
  Contexts,
  type IBasket
} from "@upmind-automation/types";
import type { BasketContext } from "./types";
import type { AnyEventObject } from "xstate";

// ---  UTILS

// -----------------------------------------------------------------------------

async function load(context: BasketContext, _event: AnyEventObject) {
  const { get, patch, useUrl } = useQuery();
  const { ensureConfig } = useBrand();

  // NB ensure we get this in order to be able to use in basket machine actions
  ensureConfig([BrandConfigKeys.REQUIRE_PAYMENT_METHOD_FOR_FREE_ORDERS]);

  // check if we are logged in as a client
  // then try to get any previous guest token a
  const client_token = getTokenFromStorage(Contexts.CLIENT);
  const guest_token = getTokenFromStorage(Contexts.GUEST);

  // if we are a client AND we have a guest token, we need to claim the basket
  if (client_token && guest_token) {
    await patch({
      mutationKey: ["basket", "claim"],
      url: useUrl("orders/claim"),
      withAccessToken: true,
      data: {
        guest_token: guest_token.access_token
      }
    }).then(() => {
      // because we have successfully claimed the basket, we can dump the guest token
      // we only do it here, as we may need to claim the basket again if something went wrong
      dumpTokenFromStorage(Contexts.GUEST);
    });
  }

  // We depend on the brand being ready, so we need to wait for it
  const { isReady } = useBrand();
  await isReady();

  // Determine the basket endpoint:
  // - If a targetBasketId is provided, load that specific basket via `orders/{id}`
  // - Otherwise, fall back to `orders/current`
  const basketEndpoint = context.targetBasketId
    ? `orders/${context.targetBasketId}`
    : "orders/current";

  const withRelations = [
    "address",
    "address.country",
    "currency",
    "custom_fields.field",
    "promotions",
    "taxes",
    "taxes.tax_tag_data",
    "client",
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
    "products.product.provision_blueprint.category",
    "products.product.provision_field_values",
    // "products.tags",
    "products.product.related",
    // "status",
    "products.product.category",
    `products.product.category${".top_category".repeat(4)}`
  ];

  // finally return a basket with all the relevant data, include the provisioning fields
  // NB  we DON'T cache the current basket as it can change frequently, and it is the source of truth
  // for the current state of the basket
  return get<IBasket>({
    url: useUrl(basketEndpoint, { with: withRelations.join() }),
    queryKey: ["basket", context.targetBasketId ?? "current"],
    staleTime: 0, // disable cache, this may still return stale data while the request is in flight
    gcTime: 0, // force cache to be cleared immediately, to prevent stale data
    withAccessToken: true
    //revalidateIfStale: true,
  })
    .then((basket: IBasket) => {
      if (isEmpty(basket)) return { basket: context.basket }; // NB ensure we persist any prev basket
      return getProvisioningFieldsValues(basket);
    })
    .catch(async (error: any) => {
      // If loading a specific basket fails (404, expired, or completed basket),
      // reject with a flag so the machine can clear targetBasketId and retry with orders/current
      if (context.targetBasketId) {
        return Promise.reject({
          targetBasketInvalid: true,
          originalError: error
        });
      }
      return Promise.reject(error);
    });
}

async function convert(
  { basket, paymentDetail }: BasketContext,
  _event: AnyEventObject
) {
  const { t } = useI18n();
  const { patch, useUrl } = useQuery();
  const { get: getCookie } = useCookies();
  const { get: getTracking } = useTracking();

  if (!basket?.id)
    return Promise.reject(
      new DetailedError(
        t("error.basket_not_available"),
        responseCodes.Unprocessable_Entity,
        ErrorOrigin.Headless
      )
    );

  const data: Record<string, any> = paymentDetail ?? {};

  // add referral cookie if available, NB DO NOT DECODE
  const referralCookie = getCookie("upm_aff", v => v);
  if (referralCookie) data.referral_cookie = referralCookie;

  // add tracking if available
  data.tracking = await getTracking().catch(() => undefined);

  // ---
  // this will return an array of the users baskets, ordered by most recent
  // but the response basket does not contain the products, so we need to
  // request the basket by id to get the products?
  return patch({
    mutationKey: ["basket", basket.id, "convert"],
    url: useUrl(`/orders/${basket?.id}/convert`),
    withAccessToken: true,
    data: omitBy(data, isNil) // NB we need to remove any null values
  });
}

async function getProvisioningFieldsValues(basket: IBasket) {
  const { get, patch, useUrl } = useQuery();

  // bail if we have no basket, or if we have a basket with products
  if (!basket || isEmpty(basket?.products)) return Promise.resolve({ basket });

  const provisioningPromises: Promise<any>[] = [];

  // Start with a promise to check the baskets provisioning fields for errors
  const checkPromise = patch({
    mutationKey: ["basket", basket.id, "provision_fields", "check"],
    url: useUrl(`orders/${basket.id}/provision_fields/values/check`),
    withAccessToken: true
  })
    .then(() => {
      // if we hit this point then we know we have no issues/errors
      // so we can return undefined
      return undefined;
    })
    .catch(error => {
      const { productErrors } = parseBasketErrors(error, basket.products);
      return productErrors;
    });

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
    const promise = get({
      url: useUrl(
        `orders/${basket.id}/products/${id}/provision_fields/values`,
        { sub_product_ids: subProducts }
      ),
      queryKey: [
        "basket",
        basket.id,
        "products",
        id,
        "provision_fields",
        "values",
        { subProducts }
      ],
      withAccessToken: true,
      staleTime: 0, // disable cache, this may still return stale data while the request is in flight
      gcTime: 0 // force cache to be cleared immediately, to prevent stale data
    }).then(data => {
      // update the product with the provisioning fields
      set(rawProduct, "provision_fields", data);
      return data;
    });

    provisioningPromises.push(promise);
  });

  // return the 'updated' basket once all the provisioning fields have been fetched
  return Promise.all(provisioningPromises)
    .then(([errors]) => ({
      basket,
      errors
    }))
    .catch(error => {
      return {
        basket,
        errors: error
      };
    });
}
async function dismissAllWarningNotes(
  { basket }: BasketContext,
  ids: string[]
) {
  const { put, useUrl } = useQuery();

  return put({
    mutationKey: ["basket", basket?.id, "warnings", "dismiss-all"],
    url: useUrl(`/orders/${basket?.id}/warnings/hide`),
    data: { ids },
    withAccessToken: true
  });
}

// -----------------------------------------------------------------------------

export { dismissAllWarningNotes };

export default {
  load,
  refresh: load,
  convert,
  isAuthenticated: () => useSession().isAuthenticated()
};
