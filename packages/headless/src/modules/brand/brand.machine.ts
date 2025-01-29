// --- external
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";
import { useApi } from "../api";
import type { BrandContext, BrandEvent } from "./types";

// --- utils
import { BrandConfigKeys, OrgFeatureKeys } from "@upmind-automation/types";
import { useBrandParser } from "./utils";
import { useTime } from "../../utils";
import { find, get, set, unset } from "lodash-es";

// --------------------------------------------------------

export default createMachine(
  {
    // tsTypes: {} as import("./brand.machine.typegen").Typegen0,
    id: "brandManager",
    predictableActionArguments: true,
    initial: "processing",
    context: {
      modules: undefined,
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
          OrgFeatureKeys.WEBHOOKS,
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
          BrandConfigKeys.BASKET_PAYMENT_TERM_DESCRIPTIONS,
          BrandConfigKeys.UI_ENTER_KEY_ACTION,
          BrandConfigKeys.UI_PRICE_BEFORE_DISCOUNT_POSITION,
        ],
      },
      // ---
      //  we dont have a set type for this yet as its 100% dynamic from the API
      //  on fetch we will inject the data into the context
      // ---
      error: {},
    } as BrandContext,

    states: {
      processing: {
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
                    actions: ["setOrganisation"],
                  },
                  onError: {
                    target: "error",
                    actions: assign({
                      error: (
                        { error }: BrandContext,
                        { data }: BrandEvent
                      ) => {
                        set(error, "organisation", data);
                        return error;
                      },
                    }),
                  },
                },
              },
              complete: {
                type: "final",
              },
              error: {
                on: {
                  RETRY: {
                    target: "loading",
                    actions: assign({
                      error: ({ error }: BrandContext) => {
                        unset(error, "organisation");
                        return error;
                      },
                    }),
                  },
                },
              },
            },
          },
          config: {
            initial: "loading",
            states: {
              loading: {
                invoke: {
                  src: "fetchBrandConfig",
                  onDone: {
                    target: "complete",
                    actions: ["setConfig"],
                  },
                  onError: {
                    target: "error",
                    actions: assign({
                      error: (
                        { error }: BrandContext,
                        { data }: BrandEvent
                      ) => {
                        set(error, "config", data);
                        return error;
                      },
                    }),
                  },
                },
              },
              complete: {
                type: "final",
              },
              error: {
                on: {
                  RETRY: {
                    target: "loading",
                    actions: assign({
                      error: ({ error }: BrandContext) => {
                        unset(error, "config");
                        return error;
                      },
                    }),
                  },
                },
              },
            },
          },
          settings: {
            initial: "loading",
            states: {
              loading: {
                invoke: {
                  src: "fetchBrandSettings",
                  onDone: {
                    target: "complete",
                    actions: ["setSettings", "setDefaultLocale"],
                  },
                  onError: {
                    target: "error",
                    actions: assign({
                      error: (
                        { error }: BrandContext,
                        { data }: BrandEvent
                      ) => {
                        set(error, "settings", data);
                        return error;
                      },
                    }),
                  },
                },
              },
              complete: {
                type: "final",
              },
              error: {
                on: {
                  RETRY: {
                    target: "loading",
                    actions: assign({
                      error: ({ error }: BrandContext) => {
                        unset(error, "settings");
                        return error;
                      },
                    }),
                  },
                },
              },
            },

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
                    actions: ["setModules"],
                  },
                  onError: {
                    target: "error",
                    actions: assign({
                      error: (
                        { error }: BrandContext,
                        { data }: BrandEvent
                      ) => {
                        set(error, "modules", data);
                        return error;
                      },
                    }),
                  },
                },
              },
              complete: {
                type: "final",
              },
              error: {
                on: {
                  RETRY: {
                    target: "loading",
                    actions: assign({
                      error: ({ error }: BrandContext) => {
                        unset(error, "modules");
                        return error;
                      },
                    }),
                  },
                },
              },
            },

            // Modules
            // /org/modules?lang=en
          },
        },
        onDone: "complete",
      },
      complete: {
        // type: "final",
        on: {
          "CONFIG.GET": {
            target: "processing.config",
            actions: ["setConfigKeys"],
          },
        },
      },
    },
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
        keys: ({ keys }: any, { data }: { data: BrandConfigKeys[] }) => {
          keys.config.push(...data);
          return keys;
        },
      }),

      // ---
      setSettings: assign((_context: BrandContext, { data }: BrandEvent) =>
        useBrandParser(data)
      ),

      setDefaultLocale: ({ languages, language_id }: BrandContext) => {
        const locale = get(find(languages, ["id", language_id]), "code");
        if (locale) useApi().setLocale(locale);
      },

      setModules: assign({
        // @ts-ignore
        modules: (_context: BrandContext, { data }: BrandEvent) => data,
      }),

      // ---
    },
    guards: {},
    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },
    // @ts-ignore
    services,
  }
);
