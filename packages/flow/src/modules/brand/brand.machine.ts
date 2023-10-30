// --- external
import { createMachine, assign } from "xstate";

// --- internal
import services, { BrandConfigKeys, OrgFeatureKeys } from "./services";
import type { BrandContext, BrandEvent } from "./types.d";

// --- utils
import { useBrandParser } from "./utils";
import { useTime } from "../../utils";
import { set, unset } from "lodash-es";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./brand.machine.typegen").Typegen0,
    id: "brandManager",
    predictableActionArguments: true,
    initial: "processing",
    context: {
      currencies: null,
      billingCycles: null,
      keys: {
        // start with these defaults
        organisation: [
          OrgFeatureKeys.CREATE_USER_API_TOKENS,
          OrgFeatureKeys.BULK_NOTIFICATIONS_ENABLED,
          OrgFeatureKeys.MULTI_BRAND_ENABLED,
          OrgFeatureKeys.PRODUCT_PROVISIONING_ENABLED,
          OrgFeatureKeys.REMOVE_UPMIND_BRANDING_ENABLED,
          OrgFeatureKeys.UNLIMITED_PAYMENT_GATEWAYS,
          OrgFeatureKeys.UNLIMITED_PROVISION_CONFIGURATIONS,
          OrgFeatureKeys.WEBHOOKS
        ],
        config: [
          BrandConfigKeys.ANALYTICS_GA_MEASUREMENT_ID,
          BrandConfigKeys.ANALYTICS_GTM_CONTAINER_ID,
          BrandConfigKeys.BASKET_DEFAULT_CURRENCY,
          BrandConfigKeys.BILLING_GATEWAY_FORCE_AUTO_PAYMENT,
          BrandConfigKeys.BILLING_GATEWAY_FORCE_CARD_STORAGE,
          BrandConfigKeys.CHECKOUT_FLOW,
          BrandConfigKeys.CHECKOUT_HIDE_DISCOUNT_CODE_FIELD,
          BrandConfigKeys.CHECKOUT_SUMMARY_COLOR_STOP1,
          BrandConfigKeys.CHECKOUT_SUMMARY_COLOR_STOP2,
          BrandConfigKeys.CHECKOUT_SUMMARY_CONTRAST_MODE,
          BrandConfigKeys.CLIENT_NOTES_AND_SECRETS_ENABLED,
          BrandConfigKeys.DEFAULT_CLIENT_HOMEPAGE,
          BrandConfigKeys.DISABLE_CLIENT_REGISTRATION,
          BrandConfigKeys.PREVENT_CARD_REMOVAL_IF_LAST,
          BrandConfigKeys.REQUIRE_PHONE_ON_REGISTRATION,
          BrandConfigKeys.SHOP_TRUNCATE_DESCRIPTIONS,
          BrandConfigKeys.SHOW_CLIENT_STORE,
          BrandConfigKeys.SUPPORT_PIN_ENABLED,
          BrandConfigKeys.UI_CLIENT_APP_DISABLE_SUPPORT_SYSTEM,
          BrandConfigKeys.UI_CLIENT_APP_PAGE_AFTER_LOGIN,
          BrandConfigKeys.UI_CLIENT_APP_PAYMENT_TERM_DESCRIPTIONS,
          BrandConfigKeys.UI_ENTER_KEY_ACTION,
          BrandConfigKeys.UI_PRICE_BEFORE_DISCOUNT_POSITION
        ]
      },
      // ---
      //  we dont have a set type for this yet as its 100% dynamic from the API
      //  on fetch we will inject the data into the context
      // ---
      error: {}
    } as BrandContext,

    type: "parallel",
    states: {
      organisation: {
        initial: "loading",
        states: {
          loading: {
            invoke: {
              src: "fetchOrganisationConfig",
              onDone: {
                target: "complete",
                actions: ["setOrganisation"]
              },
              onError: {
                target: "error",
                actions: assign({
                  error: ({ error }: BrandContext, { data }: BrandEvent) => {
                    set(error, "organisation", data || "Unknown error");
                    return error;
                  }
                })
              }
            }
          },
          complete: {},
          error: {
            on: {
              RETRY: {
                target: "loading",
                actions: assign({
                  error: ({ error }: BrandContext) => {
                    unset(error, "organisation");
                    return error;
                  }
                })
              }
            }
          }
        }
      },
      config: {
        initial: "loading",
        states: {
          loading: {
            invoke: {
              src: "fetchBrandConfig",
              onDone: {
                target: "complete",
                actions: ["setConfig"]
              },
              onError: {
                target: "error",
                actions: assign({
                  error: ({ error }: BrandContext, { data }: BrandEvent) => {
                    set(error, "config", data || "Unknown error");
                    return error;
                  }
                })
              }
            }
          },
          complete: {
            on: {
              "CONFIG.GET": { target: "loading", actions: ["setConfigKeys"] }
            }
          },
          error: {
            on: {
              RETRY: {
                target: "loading",
                actions: assign({
                  error: ({ error }: BrandContext) => {
                    unset(error, "config");
                    return error;
                  }
                })
              }
            }
          }
        }

        // Brand values
        // /config/brand/values?keys=analytics.google.measurement_id,analytics.gtm.container_id,ui.basket.default_currency,billing.gateway.force_auto_payment_for_stored_details,billing.gateway.force_card_storage,ui.checkout.checkout_flow,ui.checkout.hide_promotions_field,ui.checkout.checkout_summary_color_stop1,ui.checkout.checkout_summary_color_stop2,ui.checkout.checkout_summary_contrast_mode,ui.client_area.allow_vault,ui.client_area.homepage,ui.client_area.hide_registration_forms,billing.gateway.allow_card_removal_replacement,ui.client_registration.require_phone,ui.basket.truncate_product_description,ui.client_area.show_catalog,tickets.support.support_pin_enabled,ui.client_area.disable_support_system,ui.client_area.page_after_login,ui.client_area.payment_term_descriptions,ui.client_area.enter_key_action,ui.client_area.price_before_discount_position&lang=en
      },
      settings: {
        initial: "loading",
        states: {
          loading: {
            invoke: {
              src: "fetchBrandSettings",
              onDone: {
                target: "complete",
                actions: ["setSettings"]
              },
              onError: {
                target: "error",
                actions: assign({
                  error: ({ error }: BrandContext, { data }: BrandEvent) => {
                    set(error, "settings", data || "Unknown error");
                    return error;
                  }
                })
              }
            }
          },
          complete: {},
          error: {
            on: {
              RETRY: {
                target: "loading",
                actions: assign({
                  error: ({ error }: BrandContext) => {
                    unset(error, "settings");
                    return error;
                  }
                })
              }
            }
          }
        }

        // Brand Settings
        // /brand/settings?lang=en
      },
      modules: {
        initial: "loading",
        states: {
          loading: {
            invoke: {
              src: "fetchModules",
              onDone: {
                target: "complete",
                actions: ["setModules"]
              },
              onError: {
                target: "error",
                actions: assign({
                  error: ({ error }: BrandContext, { data }: BrandEvent) => {
                    set(error, "modules", data || "Unknown error");
                    return error;
                  }
                })
              }
            }
          },
          complete: {},
          error: {
            on: {
              RETRY: {
                target: "loading",
                actions: assign({
                  error: ({ error }: BrandContext) => {
                    unset(error, "modules");
                    return error;
                  }
                })
              }
            }
          }
        }

        // Modules
        // /org/modules?lang=en
      },
      // TODO: move to SYSTEM machine
      currencies: {
        initial: "loading",
        states: {
          loading: {
            invoke: {
              src: "fetchCurrencies",
              onDone: {
                target: "complete",
                actions: ["setCurrencies"]
              },
              onError: {
                target: "error",
                actions: assign({
                  error: ({ error }: BrandContext, { data }: BrandEvent) => {
                    set(error, "currencies", data || "Unknown error");
                    return error;
                  }
                })
              }
            }
          },
          complete: {},
          error: {
            on: {
              RETRY: {
                target: "loading",
                actions: assign({
                  error: ({ error }: BrandContext) => {
                    unset(error, "currencies");
                    return error;
                  }
                })
              }
            }
          }
        }

        // Currencies
        // /currencies?limit=0&lang=en
      },
      billingCycles: {
        initial: "loading",
        states: {
          loading: {
            invoke: {
              src: "fetchBillingCycles",
              onDone: {
                target: "complete",
                actions: ["setBillingCycles"]
              },
              onError: {
                target: "error",
                actions: assign({
                  error: ({ error }: BrandContext, { data }: BrandEvent) => {
                    set(error, "billingCycles", data || "Unknown error");
                    return error;
                  }
                })
              }
            }
          },
          complete: {},
          error: {
            on: {
              RETRY: {
                target: "loading",
                actions: assign({
                  error: ({ error }: BrandContext) => {
                    unset(error, "billingCycles");
                    return error;
                  }
                })
              }
            }
          }
        }
      }
    }
  },
  {
    actions: {
      setOrganisation: assign((_context: BrandContext, { data }: BrandEvent) =>
        useBrandParser(data)
      ),
      // ---
      setConfig: assign((_context: BrandContext, { data }: BrandEvent) =>
        useBrandParser(data)
      ),

      setConfigKeys: assign({
        keys: ({ keys }, { data }: { data: BrandConfigKeys }) => {
          keys.config.push(...data);
          return keys;
        }
      }),

      // ---
      setSettings: assign((_context: BrandContext, { data }: BrandEvent) =>
        useBrandParser(data)
      ),

      setModules: assign((_context: BrandContext, { data }: BrandEvent) =>
        useBrandParser(data)
      ),
      setCurrencies: assign({
        currencies: (_context: BrandContext, { data }: BrandEvent) => data
      }),
      setBillingCycles: assign({
        billingCycles: (_context: BrandContext, { data }: BrandEvent) => data
      })
      // ---
    },
    guards: {},
    delays: {
      wait: () => useTime().MILLISECOND * 100 // this allows us to wait for a imperceptible amount of time before continuing
    },
    services
  }
);
