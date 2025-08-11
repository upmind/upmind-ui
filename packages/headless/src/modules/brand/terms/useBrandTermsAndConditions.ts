// --- external
import { computed } from "vue";

// --- internal
import service from "./services";

// --- utils
import { isEmpty } from "lodash-es";

// --- types

// -----------------------------------------------------------------------------
/**
 * Composable to get the current terms and conditions.
 * @returns {UseTermsAndConditions} The composable methods and state for the terms and conditions.
 */
export const useTermsAndConditions = () => {
  // --- state

  const query = service.load();

  const meta = computed(() => ({
    isLoading: query?.isLoading.value || !query.isFetched.value,
    hasError: !isEmpty(query.error.value),
    isEmpty:
      isEmpty(query.data.value?.content) && isEmpty(query.data.value?.url),
    isAvailable: true,
    ...query?.data?.value?.meta // add any generated meta info here
  }));

  async function isReady(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      resolve(true);
    });
  }

  // --- context

  // --- methods

  // --- filters

  // ---------------------------------------------------------------------------

  return {
    // --- state

    /**
     * Resolves when the client items are ready to be used.
     * Returns true if ready, false if an error occurred.
     * @returns {Promise<boolean>} A promise resolving to true if ready, false if error.
     */
    isReady,

    /**
     * Meta-information about the basket state.
     * @type {Object} BasketMeta
     * @property {boolean} isError - Indicates if there was an error during the query.
     * @property {boolean} isEmpty - Indicates if the basket is empty.
     * @property {boolean} isLoading - Indicates if the query is currently loading.
     */
    meta,

    // --- context

    /**
     * The reactive data property containing the list of client items.
     * This is populated by the query and updates automatically when the query state changes.
     */
    data: query.data,

    /**
     * The current error state of the query.
     * This will be populated if the query fails to fetch data.
     */
    error: query.error,

    /**
     * Refresh the query to get the latest data.
     * This will refetch the data from the server and update the query state.
     * @returns {void}
     */
    refresh: query.refetch
  };
};

export type UseTermsAndConditions = ReturnType<typeof useTermsAndConditions>;
