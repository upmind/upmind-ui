/** @internal */
import {
  AccessRoleTypes,
  BrandConfigKeys,
  type IBasket
} from "@upmind-automation/types";
import { useBrand } from "../brand";
import { useQuery } from "../query";
import { useActiveSession, useSessionStore } from "../session-store";
import { useSystem } from "../system";
import { useTracking } from "../system-analytics";
import { useI18n } from "../system-localisation";
import { parseBasketErrors } from "./basket.utils";
import { hasProductChanges, preserveProvisionFields } from "./basket.utils";
import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  useCookies
} from "../../utils";
import {
  compact,
  concat,
  forEach,
  isEmpty,
  isNil,
  map,
  omitBy,
  set
} from "lodash-es";
import type { BasketContext } from "./basket.types";
import type { AnyEventObject } from "xstate";

// ---  UTILS

// -----------------------------------------------------------------------------

const withRelations = [
  "address",
  "address.country",
  "currency",
  "custom_fields.field",
  "promotions",
  "taxes",
  "taxes.tax_tag_data",
  "client",
  "client.default_phone",
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
  "products.product.related",
  "products.product.category",
  `products.product.category${".".concat("top_category").repeat(4)}`
];

// -----------------------------------------------------------------------------

async function fetchBasket(context: BasketContext): Promise<IBasket> {
  const { get: httpGet, useUrl } = useQuery();
  const { isReady } = useBrand();
  await isReady();

  const endpoint = context.targetBasketId
    ? `orders/${context.targetBasketId}`
    : "orders/current";

  return httpGet<IBasket>({
    url: useUrl(endpoint, { with: withRelations.join() }),
    queryKey: ["basket", context.targetBasketId ?? "current"],
    staleTime: 0,
    gcTime: 0,
    withAccessToken: true
  }).catch(async (error: any) => {
    if (context.targetBasketId) {
      return Promise.reject({
        targetBasketInvalid: true,
        originalError: error
      });
    }
    return Promise.reject(error);
  });
}

// -----------------------------------------------------------------------------

// Transfers a guest's basket ownership to a freshly-authenticated client.
// Called from both `load` and `refresh` — refresh is invoked after the
// session emits AUTHENTICATED, so the claim must run there too, otherwise
// `orders/current` returns a client-scoped basket with no `client_id` set
// against the guest's products and downstream actors (billing, paymentDetail)
// never spawn.
async function claimBasket(): Promise<void> {
  const { get, remove } = useSessionStore().useActions();

  const client_token = get(AccessRoleTypes.CLIENT);
  const guest_token = get(AccessRoleTypes.GUEST);

  if (!client_token || !guest_token) return;

  const { patch, useUrl } = useQuery();

  return patch({
    mutationKey: ["basket", "claim"],
    url: useUrl("orders/claim"),
    withAccessToken: true,
    data: {
      guest_token: guest_token.access_token
    }
  }).then(() => {
    // Only dump the guest session/token on success so we can retry the claim if it fails.
    remove(AccessRoleTypes.GUEST);
  });
}

// -----------------------------------------------------------------------------

async function load(context: BasketContext, _event: AnyEventObject) {
  const { ensureConfig } = useBrand();
  const { ensureBillingCycles, ensureCountries } = useSystem();

  // NB ensure we get this in order to be able to use in basket machine actions
  ensureConfig([BrandConfigKeys.REQUIRE_PAYMENT_METHOD_FOR_FREE_ORDERS]);

  // FE-1698: ensure lazy system data is loaded before any downstream consumer
  // (basketProduct, recommendations, productCatalogue) parses prices/terms via
  // sync getBillingCycle() / getCountry(). See system/docs/gotchas.md#1.
  await Promise.all([ensureBillingCycles(), ensureCountries()]);

  await claimBasket();

  return fetchBasket(context).then((basket: IBasket) => {
    if (isEmpty(basket)) return { basket: context.basket as IBasket };
    return getProvisioningFieldsValues(basket);
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

async function dismissWarningNote(
  { basket }: BasketContext,
  { data }: AnyEventObject
) {
  const { put, useUrl } = useQuery();

  return put({
    mutationKey: ["basket", basket?.id, "warnings"],
    url: useUrl(`/orders/${basket?.id}/warnings/hide`),
    data: { ids: [data] },
    withAccessToken: true
  });
}

async function dismissWarningNotes(
  { basket }: BasketContext,
  { data }: AnyEventObject
) {
  const { put, useUrl } = useQuery();

  return put({
    mutationKey: ["basket", basket?.id, "warnings", "dismiss-all"],
    url: useUrl(`/orders/${basket?.id}/warnings/hide`),
    data: { ids: data },
    withAccessToken: true
  });
}

// -----------------------------------------------------------------------------

async function refresh(context: BasketContext, _event: AnyEventObject) {
  await claimBasket();

  return fetchBasket(context).then((newBasket: IBasket) => {
    if (isEmpty(newBasket)) return { basket: context.basket as IBasket };

    // The flag covers prefresh-merge flows where `context.basket` is no
    // longer a reliable comparison reference. For standalone refreshes
    // (e.g. AUTHENTICATED, periodic) no prefresh has fired, the flag is
    // unset, and `context.basket` is still clean — so fall back to the
    // direct comparison to catch server-side changes.
    if (
      context.provisioningStale ||
      hasProductChanges(context.basket, newBasket)
    ) {
      return getProvisioningFieldsValues(newBasket);
    }

    preserveProvisionFields(context.basket, newBasket);
    return { basket: newBasket, errors: context.error };
  });
}

// -----------------------------------------------------------------------------

export default {
  load,
  refresh,
  convert,
  dismissWarningNote,
  dismissWarningNotes,
  isAuthenticated: () => useActiveSession().useActions().isReady()
};
