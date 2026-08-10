// --- external
import { Store } from "@tanstack/vue-store";

// --- internal
import { invalidateQueryByKey, localStoragePersister, useQuery } from "../..";

// --- utils
import { mapBrandConfig, mapBrandSettings } from "./mappers";
import { castArray, pick, uniq } from "lodash-es";

// --- types
import {
  OrgFeatureKeys,
  BrandConfigKeys,
  type IUpmindModule,
  type IBrandSettings
} from "@upmind-automation/types";

const defaultBrandConfigKeys = [
  BrandConfigKeys.ANALYTICS_GA_MEASUREMENT_ID,
  BrandConfigKeys.ANALYTICS_GTM_CONTAINER_ID,
  BrandConfigKeys.BASKET_DEFAULT_CURRENCY,
  BrandConfigKeys.BASKET_FUNNELLING,
  BrandConfigKeys.BASKET_PAYMENT_TERM_DESCRIPTIONS,
  BrandConfigKeys.BILLING_GATEWAY_FORCE_AUTO_PAYMENT,
  BrandConfigKeys.BILLING_GATEWAY_FORCE_CARD_STORAGE,
  BrandConfigKeys.CHECKOUT_FLOW,
  BrandConfigKeys.CHECKOUT_HIDE_DISCOUNT_CODE_FIELD,
  BrandConfigKeys.CHECKOUT_REQUIRE_PHONE,
  BrandConfigKeys.CHECKOUT_SUMMARY_COLOR_STOP1,
  BrandConfigKeys.CHECKOUT_SUMMARY_COLOR_STOP2,
  BrandConfigKeys.CHECKOUT_SUMMARY_CONTRAST_MODE,
  BrandConfigKeys.CLIENT_NOTES_AND_SECRETS_ENABLED,
  BrandConfigKeys.DEFAULT_CLIENT_HOMEPAGE,
  BrandConfigKeys.DEFAULT_PAYMENT_PERIOD,
  BrandConfigKeys.DISABLE_CLIENT_REGISTRATION,
  BrandConfigKeys.GUEST_CHECKOUT_ENABLED,
  BrandConfigKeys.DOMAIN_SEARCH_METHOD,
  BrandConfigKeys.PARTIAL_PAYMENTS_ENABLED,
  BrandConfigKeys.PAY_LATER_ENABLED,
  BrandConfigKeys.PREVENT_CARD_REMOVAL_IF_LAST,
  BrandConfigKeys.PRICE_DISPLAY_TYPE,
  BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS,
  BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS,
  BrandConfigKeys.REQUIRE_PHONE_ON_REGISTRATION,
  BrandConfigKeys.REQUIRE_REGION_IN_ADDRESS,
  BrandConfigKeys.SECURITY_ORDERS_REQUIRE_VERIFIED_EMAIL,
  BrandConfigKeys.SHOP_TRUNCATE_DESCRIPTIONS,
  BrandConfigKeys.SHOW_CLIENT_STORE,
  BrandConfigKeys.SHOW_PROMOTION_AS,
  BrandConfigKeys.SUPPORT_PIN_ENABLED,
  BrandConfigKeys.TAX_NUMBER_VALIDATION_ENABLED,
  BrandConfigKeys.UI_CLIENT_APP_DISABLE_SUPPORT_SYSTEM,
  BrandConfigKeys.UI_CLIENT_APP_PAGE_AFTER_LOGIN,
  BrandConfigKeys.UI_ENTER_KEY_ACTION,
  BrandConfigKeys.UI_PRICE_BEFORE_DISCOUNT_POSITION
];

const defaultOrgFeatureKeys = [
  OrgFeatureKeys.CREATE_USER_API_TOKENS,
  OrgFeatureKeys.BULK_NOTIFICATIONS_ENABLED,
  OrgFeatureKeys.MULTI_BRAND_ENABLED,
  OrgFeatureKeys.PRODUCT_PROVISIONING_ENABLED,
  OrgFeatureKeys.REMOVE_UPMIND_BRANDING_ENABLED,
  OrgFeatureKeys.UNLIMITED_PAYMENT_GATEWAYS,
  OrgFeatureKeys.UNLIMITED_PROVISION_CONFIGURATIONS,
  OrgFeatureKeys.WEBHOOKS
];

// -----------------------------------------------------------------------------

const brandConfigKeysStore = new Store<BrandConfigKeys[]>([]);

function fetchBrandSettings() {
  const { query, useUrl } = useQuery();

  return query<IBrandSettings, IBrandSettings>({
    url: useUrl("brand/settings"),
    queryKey: ["brand", "settings"],
    // --- options
    staleTime: "static",
    // A 5xx here means the brand doesn't exist — a deterministic answer, not a
    // transient fault. Retrying it blocks the unavailable-tenant redirect in init.
    retry: false,
    persister: localStoragePersister.persisterFn,
    select: mapBrandSettings
  });
}

/**
 * Fetches brand configuration values for the given keys.
 *
 * Keys are append-only — they accumulate in `brandConfigKeysStore` across calls
 * and are never removed. This means every subsequent call fetches a superset of
 * all previously requested keys.
 *
 * Because keys only grow, a single stable queryKey (`["brand", "config"]`) is
 * used, and the query returns cached data (`staleTime: "static"`) without hitting
 * the API. Newly added keys are fetched by {@link ensureBrandConfig}, which owns
 * the refetch so the caller can await the response that answers for them.
 *
 * @param keys - Brand config keys to add to the requested set. Defaults to the core set.
 */
function fetchBrandConfig(keys: BrandConfigKeys[] = defaultBrandConfigKeys) {
  const { query, useUrl } = useQuery();

  brandConfigKeysStore.setState(uniq([...brandConfigKeysStore.state, ...keys]));

  return query<Record<BrandConfigKeys, unknown>>({
    url: useUrl("config/brand/values"),
    // A function filter is evaluated by `request` at REQUEST time, not when the
    // query is created — so the fetch always carries the current key set while
    // the queryKey stays stable. Setting `keys` on the url here would freeze it
    // at whatever the set was when this query was first registered.
    filters: { keys: () => brandConfigKeysStore.state.join() },
    queryKey: ["brand", "config"],
    select: data => mapBrandConfig(data, brandConfigKeysStore.state),
    staleTime: "static",
    withoutLocale: true,
    persister: localStoragePersister.persisterFn
  });
}

/**
 * Ensures `keys` are answered by the brand config, and resolves once they are.
 *
 * Adds the keys to the requested set. A key that was already requested is already
 * in the cached config, so it resolves without a request; a genuinely new key
 * needs the one refetch that re-requests the widened set — the cached response
 * predates it and can never contain it.
 *
 * The queryKey stays stable, so this stays a SINGLE cache (and persisted) entry
 * that grows — `fetchBrandConfig` re-registers it with a url carrying the widened
 * set, and the refetch below is what sends it.
 *
 * A key the API does not return is back-filled as `null` by {@link mapBrandConfig},
 * so "answered" means present, not truthy.
 *
 * @param keys - Brand config keys to ensure are fetched.
 */
async function ensureBrandConfig(keys: BrandConfigKeys | BrandConfigKeys[]) {
  const safekeys = castArray(keys) as BrandConfigKeys[];
  const result = fetchBrandConfig(safekeys);
  await result.promise.value;
  return pick(result.data.value, safekeys);
}

function fetchModules() {
  const { query, useUrl } = useQuery();

  return query<IUpmindModule[]>({
    url: useUrl("org/modules"),
    queryKey: ["brand", "modules"],
    // --- options
    staleTime: "static",
    withoutLocale: true,
    persister: localStoragePersister.persisterFn
  });
}

function fetchOrganisationConfig() {
  const { query, useUrl } = useQuery();

  return query<Record<OrgFeatureKeys, unknown>>({
    url: useUrl("config/organisation/values", {
      keys: defaultOrgFeatureKeys.join()
    }),
    queryKey: [
      "brand",
      "organisation",
      "config",
      { keys: defaultOrgFeatureKeys }
    ],
    // --- options
    staleTime: "static",
    withoutLocale: true,
    persister: localStoragePersister.persisterFn
  });
}

// -----------------------------------------------------------------------------

export default {
  ensureBrandConfig,
  fetchBrandConfig,
  fetchBrandSettings,
  fetchModules,
  fetchOrganisationConfig
};
