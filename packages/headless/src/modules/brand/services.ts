// --- external
import { Store } from "@tanstack/vue-store";

// --- internal
import { localStoragePersister, useQuery } from "../..";

// --- utils
import { useTime } from "../../utils";
import { uniq, reduce, defaultsDeep } from "lodash-es";

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
  BrandConfigKeys.PARTIAL_PAYMENTS_ENABLED,
  BrandConfigKeys.PAY_LATER_ENABLED,
  BrandConfigKeys.PREVENT_CARD_REMOVAL_IF_LAST,
  BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS,
  BrandConfigKeys.REQUIRE_COMPANY_FOR_ORDERS,
  BrandConfigKeys.REQUIRE_PHONE_ON_REGISTRATION,
  BrandConfigKeys.REQUIRE_REGION_IN_ADDRESS,
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

function fetchOrganisationConfig() {
  const { query, useUrl } = useQuery();

  return query({
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
    staleTime: useTime()?.DAY,
    persister: localStoragePersister.persisterFn
  });
}

function fetchBrandSettings() {
  const { query, useUrl } = useQuery();

  return query<IBrandSettings, IBrandSettings>({
    url: useUrl("brand/settings"),
    queryKey: ["brand", "settings"],
    // --- options
    staleTime: useTime()?.DAY,
    persister: localStoragePersister.persisterFn
  });
}

function fetchBrandConfig(keys: BrandConfigKeys[] = defaultBrandConfigKeys) {
  const { query, useUrl } = useQuery();

  brandConfigKeysStore.setState(oldKeys => uniq([...oldKeys, ...keys]));

  return query<Record<BrandConfigKeys, unknown>>({
    url: useUrl("config/brand/values", {
      keys: brandConfigKeysStore.state.join()
    }),
    queryKey: ["brand", "config", { keys: brandConfigKeysStore.state }],
    select: data => {
      // create an object template with ALL the keys and set them to null
      // this is to ensure that the config object has all the keys that were requested
      const template = reduce(
        keys,
        (acc: { [key: string]: any }, key: string) => {
          acc[key] = null;
          return acc;
        },
        {}
      );
      // now use the template as a fallback for the data
      return defaultsDeep(data, template);
    },
    staleTime: useTime()?.DAY,
    persister: localStoragePersister.persisterFn
  });
}

function fetchModules() {
  const { query, useUrl } = useQuery();

  return query<IUpmindModule[]>({
    url: useUrl("org/modules"),
    queryKey: ["brand", "modules"],
    // --- options
    staleTime: useTime()?.DAY,
    persister: localStoragePersister.persisterFn
  });
}

// -----------------------------------------------------------------------------

export default {
  fetchModules,
  fetchBrandConfig,
  fetchBrandSettings,
  fetchOrganisationConfig
};
