// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useBrand as useUpmindBrand } from "@upmind-automation/headless";

// --- utils
import { isArray, isObject, reduce, set } from "lodash-es";

// ---
import { BrandConfigKeys } from "@upmind-automation/types";

import type { IUseBrand, IUseBrandMeta } from "./types";

/**
 * A composable that provides a simplified interface for interacting with the Brand API state machine.
 * It uses the `useUpmindBrand` composable to access the state machine service and provides helpers
 * for managing state, sending events, and accessing context data and errors.
 */
export const useBrand = (): IUseBrand => {
  const brand = useUpmindBrand();
  const { state, send } = useActor(brand.service);

  // ---------------------------------------------------------------------------
  return {
    send,
    state: computed(() => state.value.value),
    context: computed(() => state.value.context),
    errors: computed(() => state.value.context?.error),
    responses: computed(() =>
      reduce(
        state.value.context,
        (result, value, key) => {
          if (key === "error") return result;

          if (isArray(value) || isObject(value)) {
            set(result, key, value);
          } else {
            set(result, `values.${key}`, value);
          }
          return result;
        },
        { values: {} }
      )
    ),
    // ---
    meta: computed(
      (): IUseBrandMeta => ({
        isLoading: state.value.matches("processing"),
        isReady: [
          "processing.organisation.idle",
          "processing.config.idle",
          "processing.settings.idle",
          "processing.modules.idle",
          "processing.currencies.idle",

          "processing.organisation.complete",
          "processing.config.complete",
          "processing.settings.complete",
          "processing.modules.complete",
          "processing.currencies.complete",
        ].some(state.value.matches),

        isComplete: state.value.matches("complete"),

        hasErrors: [
          "organisation.error",
          "config.error",
          "settings.error",
          "modules.error",
          "currencies.error",
        ].some(state.value.matches),
      })
    ),

    isReady: brand.isReady,
    getConfig: brand.getConfig,
    getAnayltics: async () =>
      brand
        .isReady()
        .then(() =>
          brand
            .getConfig([
              BrandConfigKeys.ANALYTICS_GA_MEASUREMENT_ID,
              BrandConfigKeys.ANALYTICS_GTM_CONTAINER_ID,
            ])
            .then((data: any) => data?.analytics)
        ),
  };
};
