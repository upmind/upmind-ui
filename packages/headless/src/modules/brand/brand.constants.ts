// -----------------------------------------------------------------------------
/**
 * @module brand/brand.constants
 * @description The key lists every brand boot asks the API for. Side-effect
 * free on purpose: the recording lane (`__tests__/brand.fixtures.ts`) reads
 * the same lists the services send, so a key added here is a key recorded.
 */

import { BrandConfigKeys, OrgFeatureKeys } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

/** The config keys every brand boot asks for — the start of its `filter[keys|eq]` list. */
export const defaultBrandConfigKeys = [
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

/** The organisation feature keys every brand boot asks for. */
export const defaultOrgFeatureKeys = [
  OrgFeatureKeys.CREATE_USER_API_TOKENS,
  OrgFeatureKeys.BULK_NOTIFICATIONS_ENABLED,
  OrgFeatureKeys.MULTI_BRAND_ENABLED,
  OrgFeatureKeys.PRODUCT_PROVISIONING_ENABLED,
  OrgFeatureKeys.REMOVE_UPMIND_BRANDING_ENABLED,
  OrgFeatureKeys.UNLIMITED_PAYMENT_GATEWAYS,
  OrgFeatureKeys.UNLIMITED_PROVISION_CONFIGURATIONS,
  OrgFeatureKeys.WEBHOOKS
];
