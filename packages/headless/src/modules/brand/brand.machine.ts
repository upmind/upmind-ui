// --- external
import { createMachine, assign, spawn } from "xstate";

// --- internal
import services from "./services";
import { useSystemI18n } from "../system";
import { useQueryHelper } from "../query";

// --- utils
import { defaultsDeep, startsWith } from "lodash-es";
import { useTime } from "../../utils";
import { BrandConfigKeys, OrgFeatureKeys } from "@upmind-automation/types";
import { useBrandParser } from "./utils";

// --- types
import type { AnyEventObject } from "xstate";
import type { BrandContext } from "./types";

// -----------------------------------------------------------------------------
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
          BrandConfigKeys.BASKET_PAYMENT_TERM_DESCRIPTIONS,
          BrandConfigKeys.BILLING_GATEWAY_FORCE_AUTO_PAYMENT,
          BrandConfigKeys.BILLING_GATEWAY_FORCE_CARD_STORAGE,
          BrandConfigKeys.CHECKOUT_FLOW,
          BrandConfigKeys.CHECKOUT_HIDE_DISCOUNT_CODE_FIELD,
          BrandConfigKeys.CHECKOUT_SUMMARY_COLOR_STOP1,
          BrandConfigKeys.CHECKOUT_SUMMARY_COLOR_STOP2,
          BrandConfigKeys.CHECKOUT_SUMMARY_CONTRAST_MODE,
          BrandConfigKeys.CLIENT_NOTES_AND_SECRETS_ENABLED,
          BrandConfigKeys.DEFAULT_CLIENT_HOMEPAGE,
          BrandConfigKeys.DEFAULT_PAYMENT_PERIOD,
          BrandConfigKeys.DISABLE_CLIENT_REGISTRATION,
          BrandConfigKeys.PREVENT_CARD_REMOVAL_IF_LAST,
          BrandConfigKeys.REQUIRE_PHONE_ON_REGISTRATION,
          BrandConfigKeys.SHOP_TRUNCATE_DESCRIPTIONS,
          BrandConfigKeys.SHOW_CLIENT_STORE,
          BrandConfigKeys.SUPPORT_PIN_ENABLED,
          BrandConfigKeys.UI_CLIENT_APP_DISABLE_SUPPORT_SYSTEM,
          BrandConfigKeys.UI_CLIENT_APP_PAGE_AFTER_LOGIN,
          BrandConfigKeys.UI_ENTER_KEY_ACTION,
          BrandConfigKeys.UI_PRICE_BEFORE_DISCOUNT_POSITION,
        ],
      },
      error: undefined,
    } as BrandContext,

    states: {
      subscribing: {
        entry: ["setQueryHelper"],
        always: "loading",
      },
      loading: {
        invoke: {
          src: "load",
          onDone: {
            target: "complete",
            actions: ["setContext"],
          },
          onError: {
            target: "error",
            actions: ["setError"],
          },
        },
      },
      processing: {
        entry: ["clearError"],
        invoke: {
          src: "fetchBrandConfig",
          onDone: {
            target: "complete",
            actions: ["setContext"],
          },
          onError: {
            target: "error",
            actions: "setError",
          },
        },
      },
      error: { id: "error" },
      complete: {
        entry: ["setDefaultLocale", "setInitialised"],
        on: {
          "CONFIG.GET": {
            target: "processing",
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
      setContext: assign((context: BrandContext, { data }: AnyEventObject) =>
        useBrandParser(data, context)
      ),

      refreshContext: assign(
        (context: BrandContext, { data, queryKey }: AnyEventObject) => {
          if (!context.initialised) return;

          if (startsWith(queryKey, "brand,organisation,config")) {
            return useBrandParser(data, context);
          }

          if (startsWith(queryKey, "brand,config")) {
            return useBrandParser(data, context);
          }

          if (startsWith(queryKey, "brand,settings")) {
            return useBrandParser(data, context);
          }

          if (startsWith(queryKey, "brand,modules")) {
            return defaultsDeep(data, context);
          }
          // otherwsie do nothing
        }
      ),

      setConfigKeys: assign({
        keys: ({ keys }: BrandContext, { data }: AnyEventObject) => {
          keys.config.push(...data);
          return keys;
        },
      }),

      setDefaultLocale: (
        { initialised }: BrandContext,
        _event: AnyEventObject
      ) => {
        if (!initialised) useSystemI18n().setDefaultLocale();
      },

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
            queryHelper = spawn(useQueryHelper);

            queryHelper.send({
              type: "SET.QUERY_KEY",
              data: ["brand"],
            });
          }
          return queryHelper;
        },
      }),

      setError: assign({
        error: (_context: BrandContext, { data }: AnyEventObject) => {
          return data?.error ?? data;
        },
      }),

      clearError: assign({ error: undefined }),

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
