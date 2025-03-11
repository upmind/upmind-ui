// --- external
import { useQuery } from "../query";

import { createMachine, assign, actions } from "xstate";
const { raise } = actions;

// --- internal
import services from "./services";
import { useI18n } from "../system/i18n";

// --- utils
import { set, get } from "lodash-es";
import { useTime } from "../../utils";
import { BrandConfigKeys, OrgFeatureKeys } from "@upmind-automation/types";
import { useBrandParser } from "./utils";

// --- types
import type { BrandContext } from "./types";
import type { AnyEventObject } from "xstate";
// --------------------------------------------------------

export default createMachine(
  {
    //tsTypes: {} as import("./brand.machine.typegen").Typegen0,
    id: "brandManager",
    predictableActionArguments: true,
    initial: "processing",
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
        entry: ["setDefaultLocale", "setInitialised", "setObservable"],
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
      "REFRESH.ORGANISATION": {
        actions: ["setOrganisation"],
      },
      "REFRESH.CONFIG": {
        actions: ["setConfig"],
      },
      "REFRESH.SETTINGS": {
        actions: ["setSettings"],
      },
      "REFRESH.MODULES": {
        actions: ["setModules"],
      },
    },
  },
  {
    actions: {
      setOrganisation: assign(
        (_context: BrandContext, { data }: AnyEventObject) => {
          debugger;
          return useBrandParser(data);
        }
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

      setObservable: assign({
        observable: ({ observable }: BrandContext, _event: AnyEventObject) => {
          if (observable) return observable;

          const { queryClient } = useQuery();

          observable = queryClient.getQueryCache().subscribe(event => {
            const isOrganisationEvent =
              event.query.queryKey.toString() ===
              ["brand", "organisation", "config"].toString();

            const isSuccess = event?.action?.type === "success";

            if (isOrganisationEvent && isSuccess) {
              console.log("observable", "refresh", {
                isOrganisationEvent,
                isSuccess,
                data: event?.action?.data,
              });
              debugger;
              raise({
                type: "REFRESH.ORGANISATION",
                data: event?.action?.data?.data,
              });
            }

            //  {
            //    queryKey: ["brand", "organisation", "config"];
            //  }
          });

          // observable.subscribe((result: any) => {
          //   // send({ type: "REFRESH", data: result });
          //   // const [organisation, settings, config, modules] = result;

          //   console.log("observable", "refresh", {
          //     result,
          //   });

          //   if (result.isSuccess) {
          //     debugger;
          //     send({
          //       type: "REFRESH.ORGANISATION",
          //       data: result.data.data,
          //     });
          //   }

          //   // if (settings.isSuccess) {
          //   //   send({
          //   //     type: "REFRESH.SETTINGS",
          //   //     data: settings.data.data,
          //   //   });
          //   // }

          //   // if (config.isSuccess) {
          //   //   send({
          //   //     type: "REFRESH.CONFIG",
          //   //     data: config.data.data,
          //   //   });
          //   // }

          //   // if (modules.isSuccess) {
          //   //   send({
          //   //     type: "REFRESH.MODULES",
          //   //     data: modules.data.data,
          //   //   });
          //   // }
          // });

          return observable;
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
