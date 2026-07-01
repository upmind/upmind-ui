import { computed } from "vue";
import { loadList } from "./payment-details.services";
import { useCollection } from "../../utils";
import { isEmpty, isArray } from "lodash-es";
import type { PaymentDetail } from "./payment-details.types";

// -----------------------------------------------------------------------------
/**
 * Composable to manage the stored payment details.
 * It provides methods to retrieve stored payment details.
 * @returns {UsePaymentDetails} The composable methods and state for the stored payment details.
 */
export const usePaymentDetails = () => {
  // --- state
  const query = loadList();

  const meta = computed(() => ({
    isLoading: query?.isLoading.value || !query?.isFetched.value,
    hasError: !isEmpty(query?.error.value),
    isEmpty: isEmpty(query.data?.value),
    isAvailable: true
  }));

  async function isReady(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      resolve(true);
    });
  }

  // --- context

  // --- methods

  const { findOne, getOne, getDefault } = useCollection<PaymentDetail>(
    query.data
  );

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
    data: computed(() => {
      const data = query.data.value;
      return isArray(data) ? data : [];
    }),

    /**
     * The current error state of the query.
     * This will be populated if the query fails to fetch data.
     */
    error: query?.error,

    // --- methods

    /**
     * Get a single address by id.
     * @param id The id of the address to get.
     * @returns The address object if found, is otherwise undefined.
     */
    getOne,

    /**
     * Find a single address based on the given param. The param is matched against the title and description.
     * @param mapping The filter to match against the address title and description.
     * @returns The address object if found, is otherwise undefined.
     */
    findOne,

    /**
     * The default Payment detail.
     * This is the stored payment detail that is set as default for the current client.
     * @returns {PaymentDetail} The default Payment detail if found, is otherwise undefined.
     */
    default: getDefault,

    /**
     * Refresh the query to get the latest data.
     * This will refetch the data from the server and update the query state.
     * @returns {void}
     */
    refresh: () => query?.refetch()
  };
};

/**
 * The return type of {@link usePaymentDetails} composable.
 */
export type UsePaymentDetails = ReturnType<typeof usePaymentDetails>;
