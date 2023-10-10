// --- internal
import { useApi } from "../api";

// --- utils

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

// this will process the request and return a promise

async function fetchOrganisationConfig(_context: any, _event: any) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("config/organisation/values", {
      keys: [
        "package.enabled_features.create_user_api_tokens",
        "package.enabled_features.bulk_notifications",
        "package.enabled_features.multi_brand",
        "package.enabled_features.product_provisioning",
        "package.enabled_features.remove_upmind_branding",
        "package.enabled_features.unlimited_payment_gateways",
        "package.enabled_features.unlimited_provisioning_configurations",
        "package.enabled_features.webhooks"
      ].join(","),
      lang: "en"
    }),
    useCache: true,
    maxAge: useTime()?.DAY
  }).then(({ data }: any) => data);
}

async function fetchBrandSettings(_context: any, _event: any) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("brand/settings", { lang: "en" }),
    useCache: true,
    maxAge: useTime()?.DAY
  }).then(({ data }: any) => data);
}

async function fetchBrandConfig(_context: any, _event: any) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("config/brand/values", {
      keys: [
        "analytics.google.measurement_id",
        "analytics.gtm.container_id",
        "ui.basket.default_currency",
        "billing.gateway.force_auto_payment_for_stored_details",
        "billing.gateway.force_card_storage",
        "ui.checkout.checkout_flow",
        "ui.checkout.hide_promotions_field",
        "ui.checkout.checkout_summary_color_stop1",
        "ui.checkout.checkout_summary_color_stop2",
        "ui.checkout.checkout_summary_contrast_mode",
        "ui.client_area.allow_vault",
        "ui.client_area.homepage",
        "ui.client_area.hide_registration_forms",
        "billing.gateway.allow_card_removal_replacement",
        "ui.client_registration.require_phone",
        "ui.basket.truncate_product_description",
        "ui.client_area.show_catalog",
        "tickets.support.support_pin_enabled",
        "ui.client_area.disable_support_system",
        "ui.client_area.page_after_login",
        "ui.client_area.payment_term_descriptions",
        "ui.client_area.enter_key_action",
        "ui.client_area.price_before_discount_position"
      ].join(","),
      lang: "en"
    }),
    useCache: true,
    maxAge: useTime()?.DAY
  }).then(({ data }: any) => data);
}

async function fetchModules(_context: any, _event: any) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("org/modules", { lang: "en" }),
    useCache: true,
    maxAge: useTime()?.DAY
  }).then(({ data }: any) => data);
}

async function fetchCurrencies(_context: any, _event: any) {
  const { get, useUrl, useTime } = useApi();

  return get({
    url: useUrl("currencies", { limit: 0, lang: "en" }),
    useCache: true,
    maxAge: useTime()?.DAY
  }).then(({ data }: any) => data);
}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  fetchOrganisationConfig,
  fetchBrandSettings,
  fetchBrandConfig,
  fetchModules,
  fetchCurrencies
};
