// --- internal
import { useApi } from "@/modules/api";
const { get, useUrl } = useApi();

// --- utils

// --------------------------------------------------------
// ENUMS

// --------------------------------------------------------
// SERVICE METHODS
// Invoked by machines, providing context and event data

// this will process the request and return a promise

async function fetchOrganisation(context, event) {
  return get({
    url: useUrl(
      "config/organisation/values?keys=package.enabled_features.create_user_api_tokens,package.enabled_features.bulk_notifications,package.enabled_features.multi_brand,package.enabled_features.product_provisioning,package.enabled_features.remove_upmind_branding,package.enabled_features.unlimited_payment_gateways,package.enabled_features.unlimited_provisioning_configurations,package.enabled_features.webhooks&lang=en"
    )
  });
}
async function fetchSettings(context, event) {}
async function fetchConfig(context, event) {}
async function fetchModules(context, event) {}
async function fetchCurrencies(context, event) {}

// --------------------------------------------------------
// EXPORTS

export default <Object>{
  fetchOrganisation,
  fetchSettings,
  fetchConfig,
  fetchModules,
  fetchCurrencies
};
