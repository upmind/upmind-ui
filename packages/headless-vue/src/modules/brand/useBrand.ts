// --- external
import { computed } from "vue";
import { useActor } from "@xstate/vue";

// --- internal
import { useBrand as useUpmindBrand } from "@upmind-automation/headless";

// --- utils
import { isArray, isObject, reduce, set } from "lodash-es";

// ---
import { BrandConfigKeys } from "@upmind-automation/types";

/**
 * A composable that provides a simplified interface for interacting with the Brand API state machine.
 * It uses the `useUpmindBrand` composable to access the state machine service and provides helpers
 * for managing state, sending events, and accessing context data and errors.
 */

export const useBrand = () => {
  const brand = useUpmindBrand();
  const { state, send } = useActor(brand.service);

  // ---------------------------------------------------------------------------
  return {
    /**
     * Function to send events to the brand state machine.
     * @param event The event to send.
     */
    send,

    /**
     * Computed property to the current state of the brand state machine.
     */
    state: computed(() => state.value.value),

    /**
     * Computed property to the brand's state machine context, containing configuration data and settings.
     */
    context: computed(() => state.value.context),

    /**
     * Computed property to any errors encountered during the brand state machine's process.
     */
    errors: computed(() => state.value.context?.error),

    /**
     * Computed property to the structured responses from the state machine context, excluding errors.
     */
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
    /**
     * Computed property to metadata flags about brand data.
     */
    meta: computed(() => ({
      /**
       * Indicates whether the brand state machine is currently in a loading state.
       */
      isLoading: state.value.matches("processing"),

      /**
       * Indicates whether the brand data is fully ready.
       */
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
        "processing.currencies.complete"
      ].some(state.value.matches),

      /**
       * Indicates whether the brand state machine has completed its operations.
       */
      isComplete: state.value.matches("complete"),

      /**
       * Indicates if any errors have occurred during the brand state machine's process.
       */
      hasErrors: [
        "organisation.error",
        "config.error",
        "settings.error",
        "modules.error",
        "currencies.error"
      ].some(state.value.matches)
    })),

    /**
     * Method that checks if the brand data is fully ready.
     * @returns {boolean} Returns true if the brand data is ready.
     */
    isReady: brand.isReady,

    /**
     * Get brandconfiguration keys from the context. This assumes that the keys are already in context.
     * It will not request the keys from the API if they are not already in context.
     * @returns {Record<string, any>} The requested keys from the brand configuration.
     */
    getConfig: brand.getConfig,

    /**
     * Get brand configuration, fetching from the API if it is not already in context.
     * @returns {Record<string, any>;} The requested keys from the brand configuration.
     */
    ensureConfig: brand.ensureConfig,

    /**
     * Fetch the analytics configuration keys (`ANALYTICS_GA_MEASUREMENT_ID` and `ANALYTICS_GTM_CONTAINER_ID`).
     * @returns {Promise<any>} A promise that resolves to the analytics configuration data.
     */
    getAnayltics: brand.getAnayltics,

    /**
     * Get the brand name from the context.
     * @returns {string} The brand name.
     */
    getBrandName: brand.getBrandName,

    /**
     * Get the brand image from the context.
     * @returns {object} The brand image object.
     */
    getImage: brand.getImage,

    /**
     * Get the brand styles from the context.
     * @returns {object} The brand styles object.
     */
    getStyles: brand.getStyles,

    /**
     * Get the brand favicon from the context.
     * @returns {object} The brand favicon object.
     */
    getFavicon: brand.getFavicon,

    /**
     * Get the brand meta from the context.
     * @returns {object} The brand meta object.
     */
    getMeta: computed(() => {
      return state.value.context.meta;
    })
  };
};
