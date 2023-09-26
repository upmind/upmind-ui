// --- external
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";

// --- utils

// --------------------------------------------------------
export default createMachine(
  {
    tsTypes: {} as import("./brand.machine.typegen").Typegen0,
    id: "brand",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      package: {
        enabled_features: {
          remove_upmind_branding: null
        }
      },
      // ---
      id: null,
      code: null,
      name: null,
      style: {
        brand_color: null,
        brand_font: {
          family: null,
          version: null
        }
      },
      prefix: null,
      currency_id: null,
      country_id: null,
      language_id: null,
      pricelist_id: null,
      tax_type: null,
      vat_exempt: null,
      vat_number: null,
      wipe_data: null,
      demo_data_import_id: null,
      region_id: null,
      domain: null,
      has_demo_data: null,
      currencies: null,
      oauth_clients: null,
      languages: null,
      image: null,
      icon: null,
      favicon: null,
      email_logo: null,
      // ---
      analytics: {
        gtm: {
          container_id: null
        },
        google: {
          measurement_id: null
        }
      },
      // ---
      billing: {
        gateway: {
          force_card_storage: null,
          allow_card_removal_replacement: null,
          force_auto_payment_for_stored_details: null
        }
      },
      // ---
      tickets: {
        support: {
          support_pin_enabled: null
        }
      },
      // ---
      ui: {
        basket: {
          default_currency: null,
          price_before_discount_position: null,
          payment_term_descriptions: null,
          truncate_product_description: null
        },
        checkout: {
          checkout_flow: null,
          checkout_summary_color_stop1: null,
          checkout_summary_color_stop2: null,
          checkout_summary_contrast_mode: null,
          hide_promotions_field: null
        },
        client_area: {
          allow_vault: null,
          homepage: null,
          hide_registration_forms: null,
          require_phone: null,
          show_catalog: null,
          disable_support_system: null,
          page_after_login: null,
          enter_key_action: null
        },
        client_registration: {
          require_phone: null
        }
      },
      // ---
      error: null
    },
    states: {
      loading: {
        id: "loading",
        states: {
          organisation: {
            invoke: {
              src: "fetchOrganisation",
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
              src: "fetchSettings",
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
              src: "fetchConfig",
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
                target: "#available",
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
      available: {
        id: "available"
        // type: "final" // do we need to stop the machine here?
      },
      // Handle errors
      error: {
        id: "error",
        on: {
          RETRY: { target: "loading", actions: ["clearError"] }
        }
      }
    }
  },
  {
    actions: {
      setOrganisation: assign((context, { data }) => ({ ...data })),
      setSettings: assign((context, { data }) => ({ ...data })),
      setConfig: assign((context, { data }) => ({ ...data })),
      setModules: assign((context, { data }) => ({ ...data })),
      setCurrencies: assign((context, { data }) => ({ ...data })),
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
