// --- external
import { Store } from "@tanstack/vue-store";

// --- internal
import { invalidateQueryByKey, localStoragePersister, useQuery } from "../..";

// --- utils
import { mapBrandConfig, mapBrandSettings } from "./mappers";
import { uniq } from "lodash-es";

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
 * used. When new keys are added, `refetch()` is called to re-fetch with the
 * expanded key set. Vue-query auto-cancels any in-flight request for the same
 * queryKey, so an older (smaller) response can never overwrite a newer (larger) one.
 *
 * If no new keys are added (same accumulated set), the query returns cached data
 * (`staleTime: "static"`) without hitting the API.
 *
 * @param keys - Brand config keys to ensure are fetched. Defaults to the core set.
 */
function fetchBrandConfig(keys: BrandConfigKeys[] = defaultBrandConfigKeys) {
  const { query, useUrl } = useQuery();

  const currentKeys = brandConfigKeysStore.state;
  const newKeys = uniq([...currentKeys, ...keys]);
  brandConfigKeysStore.setState(newKeys);
  const hasNewKeys = newKeys.length > currentKeys.length;

  const result = query<Record<BrandConfigKeys, unknown>>({
    url: useUrl("config/brand/values", {
      keys: brandConfigKeysStore.state.join()
    }),
    queryKey: ["brand", "config"],
    select: data => mapBrandConfig(data, brandConfigKeysStore.state),
    staleTime: "static",
    withoutLocale: true,
    persister: localStoragePersister.persisterFn
  });

  // New keys added → refetch with expanded URL.
  // Vue-query auto-cancels any in-flight request for the same queryKey,
  // so the old (smaller key set) response can never overwrite the new one.
  if (hasNewKeys && currentKeys?.length) result.refetch();

  return result;
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
  fetchBrandConfig,
  fetchBrandSettings,
  fetchModules,
  fetchOrganisationConfig
};
