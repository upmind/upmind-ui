// --- internal
import { useApi } from "../api";

// --- utils
import { filter, has, reduce, defaultsDeep } from "lodash-es";

// --------------------------------------------------------
// ENUMS

/**
 * Enum representing the various configuration keys available for branding settings.
 * These keys are used to configure and manage various aspects of the brand system,
 * including invoicing, billing, UI settings, analytics, and more.
 */
export enum BrandConfigKeys {
  /**
   * Key to enable accounting revenue recognition settings for invoices.
   */
  ACCOUNTING_REVENUE_RECOGNITION = "invoices.common.accounting_revenue_recognition",

  /**
   * Default redirect link for affiliate systems.
   */
  AFFILIATES_DEFAULT_REDIRECT_LINK = "affiliate_systems.settings.default_redirect",

  /**
   * Allowed file types for uploads, defined for security purposes.
   */
  ALLOWED_UPLOAD_FILE_TYPES = "security.uploads.allowed_upload_file_types",

  /**
   * Google Analytics Measurement ID for tracking purposes.
   */
  ANALYTICS_GA_MEASUREMENT_ID = "analytics.google.measurement_id",

  /**
   * Google Tag Manager Container ID for managing tags.
   */
  ANALYTICS_GTM_CONTAINER_ID = "analytics.gtm.container_id",

  /**
   * Default currency used in the shopping basket.
   */
  BASKET_DEFAULT_CURRENCY = "ui.basket.default_currency",

  /**
   * Enforces automatic payment for stored details at the billing gateway.
   */
  BILLING_GATEWAY_FORCE_AUTO_PAYMENT = "billing.gateway.force_auto_payment_for_stored_details",

  /**
   * Forces the storage of card details during the checkout process.
   */
  BILLING_GATEWAY_FORCE_CARD_STORAGE = "billing.gateway.force_card_storage",

  /**
   * Configuration for how billing terms are displayed in the basket.
   */
  BILLING_TERM_DISPLAY = "ui.basket.billing_term_display",

  /**
   * Defines the overall flow of the checkout process.
   */
  CHECKOUT_FLOW = "ui.checkout.checkout_flow",

  /**
   * Hides the discount code field in the checkout process.
   */
  CHECKOUT_HIDE_DISCOUNT_CODE_FIELD = "ui.checkout.hide_promotions_field",

  /**
   * The first stop in the gradient for the checkout summary's background color.
   */
  CHECKOUT_SUMMARY_COLOR_STOP1 = "ui.checkout.checkout_summary_color_stop1",

  /**
   * The second stop in the gradient for the checkout summary's background color.
   */
  CHECKOUT_SUMMARY_COLOR_STOP2 = "ui.checkout.checkout_summary_color_stop2",

  /**
   * Enables contrast mode for the checkout summary.
   */
  CHECKOUT_SUMMARY_CONTRAST_MODE = "ui.checkout.checkout_summary_contrast_mode",

  /**
   * Enables clients to add notes and secrets to their accounts.
   */
  CLIENT_NOTES_AND_SECRETS_ENABLED = "ui.client_area.allow_vault",

  /**
   * Default homepage for clients after they log in.
   */
  DEFAULT_CLIENT_HOMEPAGE = "ui.client_area.homepage",

  /**
   * Disables client registration forms.
   */
  DISABLE_CLIENT_REGISTRATION = "ui.client_area.hide_registration_forms",

  /**
   * Enables guest checkout for invoices.
   */
  GUEST_CHECKOUT_ENABLED = "invoices.guest_checkout.enabled",

  /**
   * Base rule for invoice consolidation.
   */
  INVOICE_CONSOLIDATION_BASE_RULE = "invoices.consolidation.base_rule",

  /**
   * Date rule for invoice consolidation, set by day of the month.
   */
  INVOICE_CONSOLIDATION_DATE = "invoices.consolidation.base_rule_date_of_month_day",

  /**
   * Enables the invoice consolidation feature.
   */
  INVOICE_CONSOLIDATION_ENABLED = "invoices.consolidation.enabled",

  /**
   * Weekday rule for invoice consolidation.
   */
  INVOICE_CONSOLIDATION_WEEK_DAY = "invoices.consolidation.base_rule_day_of_week",

  /**
   * Enables a separate sequence for credit note numbers.
   */
  INVOICE_CREDIT_NOTE_NUMBER_SEPARATE = "invoices.common.credit_note_number_separate_sequence",

  /**
   * Allows partial payments for clients at the billing gateway.
   */
  PARTIAL_PAYMENTS_ENABLED = "billing.gateway.client_allow_partial_payments",

  /**
   * Enables the "Pay Later" option for invoices.
   */
  PAY_LATER_ENABLED = "invoices.common.is_available_pay_later",

  /**
   * Prevents card removal if it's the last saved payment method for a client.
   */
  PREVENT_CARD_REMOVAL_IF_LAST = "billing.gateway.allow_card_removal_replacement",

  /**
   * Controls how prices are displayed on invoices.
   */
  PRICE_DISPLAY_TYPE = "invoices.common.display_price_type",

  /**
   * Sets the default payment period for invoices.
   */
  PRICE_TAX_PRICE_DEFAULT_PAYMENT_PERIOD = "invoices.common.default_payment_period",

  /**
   * Requires an address for placing orders.
   */
  REQUIRE_ADDRESS_FOR_ORDERS = "invoices.common.require_address_for_orders",

  /**
   * Requires a phone number during client registration.
   */
  REQUIRE_PHONE_ON_REGISTRATION = "ui.client_registration.require_phone",

  /**
   * Requires a region to be specified in addresses for invoices.
   */
  REQUIRE_REGION_IN_ADDRESS = "invoices.common.required_region_in_address",

  /**
   * Truncates long product descriptions in the shop interface.
   */
  SHOP_TRUNCATE_DESCRIPTIONS = "ui.basket.truncate_product_description",

  /**
   * Displays the client store in the client area.
   */
  SHOW_CLIENT_STORE = "ui.client_area.show_catalog",

  /**
   * Displays promotions in the catalog.
   */
  SHOW_PROMOTIONS_ON_CATALOG = "invoices.common.show_promotions_on_catalog",

  /**
   * Defines how promotions are displayed in the catalog.
   */
  SHOW_PROMOTION_AS = "invoices.common.show_promotion_as",

  /**
   * Interval for canceling subscription contracts.
   */
  SUBSCRIPTIONS_CANCEL_INTERVAL = "subscriptions.contract.invoice_contract_cancel_interval",

  /**
   * Interval for closing subscription contracts.
   */
  SUBSCRIPTIONS_CLOSE_INTERVAL = "subscriptions.contract.invoice_contract_close_interval",

  /**
   * Recommended money-back period for subscription contracts.
   */
  SUBSCRIPTIONS_MONEY_BACK_PERIOD = "subscriptions.contract.product_recommended_money_back_period",

  /**
   * Interval for suspending subscription contracts.
   */
  SUBSCRIPTIONS_SUSPEND_INTERVAL = "subscriptions.contract.invoice_contract_suspend_interval",

  /**
   * Enables support PIN for client authentication.
   */
  SUPPORT_PIN_ENABLED = "tickets.support.support_pin_enabled",

  /**
   * Disables the support system in the client app.
   */
  UI_CLIENT_APP_DISABLE_SUPPORT_SYSTEM = "ui.client_area.disable_support_system",

  /**
   * Defines the page clients see after logging in.
   */
  UI_CLIENT_APP_PAGE_AFTER_LOGIN = "ui.client_area.page_after_login",

  /**
   * Describes payment terms in the client app.
   */
  UI_CLIENT_APP_PAYMENT_TERM_DESCRIPTIONS = "ui.client_area.payment_term_descriptions",

  /**
   * Defines the action taken when pressing the Enter key in forms.
   */
  UI_ENTER_KEY_ACTION = "ui.client_area.enter_key_action",

  /**
   * Displays the price before discount in the client app.
   */
  UI_PRICE_BEFORE_DISCOUNT_POSITION = "ui.client_area.price_before_discount_position",

  /**
   * Enables customer control features in the Upmind affiliates system.
   */
  UPMIND_AFFILIATES_CUSTOMER_CONTROLS_ENABLED = "affiliate_systems.upmind.customer_controls_enabled",

  /**
   * Enables the Upmind affiliates system.
   */
  UPMIND_AFFILIATES_ENABLED = "affiliate_systems.upmind.enabled",
}

export enum OrgFeatureKeys {
  CREATE_USER_API_TOKENS = "package.enabled_features.create_user_api_tokens",
  BULK_NOTIFICATIONS_ENABLED = "package.enabled_features.bulk_notifications",
  MULTI_BRAND_ENABLED = "package.enabled_features.multi_brand",
  PRODUCT_PROVISIONING_ENABLED = "package.enabled_features.product_provisioning",
  REMOVE_UPMIND_BRANDING_ENABLED = "package.enabled_features.remove_upmind_branding",
  UNLIMITED_PAYMENT_GATEWAYS = "package.enabled_features.unlimited_payment_gateways",
  UNLIMITED_PROVISION_CONFIGURATIONS = "package.enabled_features.unlimited_provisioning_configurations",
  WEBHOOKS = "package.enabled_features.webhooks",
}

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

// this will process the request and return a promise

async function fetchOrganisationConfig({ keys }: any, _event: any) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("config/organisation/values", {
      keys: keys.organisation.join(),
    }),
    useCache: true,
    maxAge: useTime()?.DAY,
  }).then(({ data }: any) => data);
}

async function fetchBrandSettings(_context: any, _event: any) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("brand/settings", {}),
    useCache: true,
    maxAge: useTime()?.DAY,
  }).then(({ data }: any) => data);
}

// brand config is slightly different because we can ask for more config fro mthe api
// than what we initially requested, this allows us to only request config as we need it
async function fetchBrandConfig(context: any, _event: any) {
  const { get, useUrl, useTime } = useApi();

  // only request keys that are missing from the state, if any
  const missingKeys = filter(context.keys.config, key => !has(context, key));

  if (!missingKeys.length) return Promise.resolve();

  return get({
    url: useUrl("config/brand/values", {
      keys: missingKeys.join(),
    }),
    useCache: true,
    maxAge: useTime()?.DAY,
  }).then(({ data }: any) => {
    // create an object template with ALL the keys and set them to null
    // this is to ensure that the config object has all the keys that were requested
    const template = reduce(
      missingKeys,
      (acc: { [key: string]: any }, key: string) => {
        acc[key] = null;
        return acc;
      },
      {}
    );
    // now use the  tempalte as a fallback for the data
    return defaultsDeep(data, template);
  });
}

async function fetchModules(_context: any, _event: any) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("org/modules", {}),
    useCache: true,
    maxAge: useTime()?.DAY,
  }).then(({ data }: any) => data);
}

// --------------------------------------------------------
// EXPORTS

export default {
  fetchOrganisationConfig,
  fetchBrandSettings,
  fetchBrandConfig,
  fetchModules,
};
