// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useBrand as useUpmindBrand } from "@upmind/headless";

// --- utils
import { isArray, isObject, reduce, set } from "lodash-es";

// ---
import { BrandConfigKeys } from "@upmind/headless";

/**
 * A composable that provides a simplified interface for interacting with the Brand API state machine.
 * It uses the `useUpmindBrand` composable to access the state machine service and provides helpers
 * for managing state, sending events, and accessing context data and errors.
 *
 * @returns {Object} The composable returns an object containing the following values:
 * - `send`: Function to send events to the brand state machine.
 * - `state`: The current state of the brand state machine.
 * - `context`: The brand's state machine context, including config and settings.
 * - `errors`: Any errors encountered during the state machine's process.
 * - `responses`: Structured responses from the state machine context, excluding errors.
 * - `meta`: Metadata with various flags about status of brand data like `isLoading` and `isReady`.
 * - `isReady`: Method that checks if the brand data is fully ready.
 * - `getConfig`: Method that retrieves the brand configuration.
 * - `getAnayltics`: Method that fetches the analytics configuration keys (`ANALYTICS_GA_MEASUREMENT_ID` and `ANALYTICS_GTM_CONTAINER_ID`).
 *
 */
export const useBrand = (): any => {
  const brand = useUpmindBrand();
  const { state, send } = useActor(brand.service);

  // --------------------------------------------------------

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
    meta: computed(() => ({
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
    })),

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
