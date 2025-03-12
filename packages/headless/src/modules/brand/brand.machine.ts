// --- external
import { createMachine, assign, spawn, sendTo } from "xstate";

// --- internal
import services from "./services";
import { useI18n } from "../system/i18n";
import { querySubscription } from "../query";

// --- utils
import { set, get } from "lodash-es";
import { useTime } from "../../utils";
import { BrandConfigKeys, OrgFeatureKeys } from "@upmind-automation/types";
import { useBrandParser } from "./utils";

// --- types
import type { AnyEventObject } from "xstate";
import type { BrandContext } from "./types";
import type { QueryCacheNotifyEvent, QuerySubscriptionFilter } from "../query";

// --------------------------------------------------------

export default createMachine(
  {
    //tsTypes: {} as import("./brand.machine.typegen").Typegen0,
    id: "brandManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {
      initialised: false,
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
      error: undefined,
    } as BrandContext,

    states: {
      subscribing: {
        entry: ["setQueryHelper"],
        always: "processing",
      },
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
                    target: "#error",
                    actions: assign({
                      error: (
                        { error }: BrandContext,
                        { data }: AnyEventObject
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
              error: {},
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
                        { data }: AnyEventObject
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
                on: {},
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
                    actions: ["setSettings"],
                  },
                  onError: {
                    target: "error",
                    actions: assign({
                      error: (
                        { error }: BrandContext,
                        { data }: AnyEventObject
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
              error: {},
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
                        { data }: AnyEventObject
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
              error: {},
            },

            // Modules
            // /org/modules?lang=en
          },
        },
        onDone: "complete",
      },
      error: { id: "error" },
      complete: {
        entry: ["setDefaultLocale", "setInitialised"],
        // type: "final",
        on: {
          "CONFIG.GET": {
            target: "processing.config",
            actions: ["setConfigKeys"],
          },
        },
      },
    },
    on: {
      "QUERY.SUCCESS": {
        actions: ["refreshContext"],
      },
    },
  },
  {
    actions: {
      refreshContext: assign(
        ({ initialised }: BrandContext, { data, queryKey }: AnyEventObject) => {
          if (!initialised) return;
          switch (queryKey) {
            case "brand,organisation,config":
              return useBrandParser(data);

            case "brand,config":
              return useBrandParser(data);

            case "brand,settings":
              return useBrandParser(data);

            case "brand,modules":
              return data;

            default:
              return; // do nothing
          }
        }
      ),

      setOrganisation: assign(
        (_context: BrandContext, { data }: AnyEventObject) =>
          useBrandParser(data)
      ),
      // ---
      setConfig: assign((_context: BrandContext, { data }: AnyEventObject) =>
        useBrandParser(data)
      ),

      setConfigKeys: assign({
        keys: ({ keys }: BrandContext, { data }: AnyEventObject) => {
          keys.config.push(...data);
          return keys;
        },
      }),

      // ---
      setSettings: assign((_context: BrandContext, { data }: AnyEventObject) =>
        useBrandParser(data)
      ),

      setDefaultLocale: (
        { initialised }: BrandContext,
        _event: AnyEventObject
      ) => {
        if (!initialised) useI18n().setDefaultLocale();
      },

      setModules: assign({
        modules: (_context: BrandContext, { data }: AnyEventObject) => data,
      }),

      setInitialised: assign({
        initialised: true,
      }),

      setQueryHelper: assign({
        queryHelper: (
          { queryHelper }: BrandContext,
          _event: AnyEventObject
        ) => {
          // spawn a new query helper and set up the filter to only listen to brand events
          if (!queryHelper) {
            queryHelper = spawn(querySubscription);
            const queryFilter: QuerySubscriptionFilter = (
              event: QueryCacheNotifyEvent
            ) => event.query.queryKey.includes("brand");

            queryHelper.send({
              type: "FILTER",
              data: queryFilter,
            });
          }
          return queryHelper;
        },
      }),

      // ---
    },
    guards: {},
    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },
    services,
  }
);
