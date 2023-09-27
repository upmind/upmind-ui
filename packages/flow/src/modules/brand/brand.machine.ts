// --- external
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";

// --- utils
import { reduce, set, get } from "lodash-es";

// --------------------------------------------------------
const parseData = data =>
  reduce(
    data,
    (result, value, key) => {
      set(result, key, value);
      return result;
    },
    {}
  );

export default createMachine(
  {
    tsTypes: {} as import("./brand.machine.typegen").Typegen0,
    id: "brandManager",
    predictableActionArguments: true,
    initial: "processing",
    context: {
      //  we dont have a set type for this yet as its 100% dynamic from the API
      //  on fetch we will inject the data into the context
      // ---
      error: null
    },
    states: {
      processing: {
        id: "processing",
        initial: "organisation",
        states: {
          organisation: {
            invoke: {
              src: "fetchOrganisationConfig",
              onDone: {
                target: "settings",
                actions: ["setOrganisation"]
              },
              onError: {
                target: "#error",
                actions: ["setError"]
              }
            }
          },
          settings: {
            invoke: {
              src: "fetchBrandSettings",
              onDone: {
                target: "config",
                actions: ["setSettings"]
              },
              onError: {
                target: "#error",
                actions: ["setError"]
              }
            }
            // Brand Settings
            // /brand/settings?lang=en
          },
          config: {
            invoke: {
              src: "fetchBrandConfig",
              onDone: {
                target: "modules",
                actions: ["setConfig"]
              },
              onError: {
                target: "#error",
                actions: ["setError"]
              }
            }
            // Brand values
            // /config/brand/values?keys=analytics.google.measurement_id,analytics.gtm.container_id,ui.basket.default_currency,billing.gateway.force_auto_payment_for_stored_details,billing.gateway.force_card_storage,ui.checkout.checkout_flow,ui.checkout.hide_promotions_field,ui.checkout.checkout_summary_color_stop1,ui.checkout.checkout_summary_color_stop2,ui.checkout.checkout_summary_contrast_mode,ui.client_area.allow_vault,ui.client_area.homepage,ui.client_area.hide_registration_forms,billing.gateway.allow_card_removal_replacement,ui.client_registration.require_phone,ui.basket.truncate_product_description,ui.client_area.show_catalog,tickets.support.support_pin_enabled,ui.client_area.disable_support_system,ui.client_area.page_after_login,ui.client_area.payment_term_descriptions,ui.client_area.enter_key_action,ui.client_area.price_before_discount_position&lang=en
          },
          modules: {
            invoke: {
              src: "fetchModules",
              onDone: {
                target: "currencies",
                actions: ["setModules"]
              },
              onError: {
                target: "#error",
                actions: ["setError"]
              }
            }
            // Modules
            // /org/modules?lang=en
          },
          currencies: {
            invoke: {
              src: "fetchCurrencies",
              onDone: {
                target: "#processed",
                actions: ["setCurrencies"]
              },
              onError: {
                target: "#error",
                actions: ["setError"]
              }
            }
            // Currencies
            // /currencies?limit=0&lang=en
          }
        }
      },
      processed: {
        id: "processed",
        initial: "available",
        states: {
          available: {
            // type: "final" // do we need to stop the machine here?
          }
        }
      },

      // Handle errors
      error: {
        id: "error",
        on: {
          RETRY: { target: "processing", actions: ["clearError"] }
        }
      }
    }
  },
  {
    actions: {
      setOrganisation: assign((context, { data }) => parseData(data)),
      setSettings: assign((context, { data }) => parseData(data)),
      setConfig: assign((context, { data }) => parseData(data)),
      setModules: assign((context, { data }) => parseData(data)),
      setCurrencies: assign({
        currencies: (context, { data }) => data
      }),
      // ---
      setError: assign({
        error: (context, { data }) => data || "Unknown error"
      }),
      clearError: assign({ error: null })
    },
    guards: {},
    services
  }
);
