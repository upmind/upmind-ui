// --- external
import { computed } from "vue";

// --- internal
import service from "./service";
import { useSession } from "../session";
import { invalidateQueryByKey } from "../query";

// --- utils
import { isEmpty } from "lodash-es";

// --- types
import type { Invoice } from "./types";

/**
 * Composable to manage a single invoice.
 * It provides methods to load and manage the state of an invoice.
 * @param {Invoice["id"]} invoiceId - The ID of the invoice to load.
 */
export const useInvoice = (invoiceId: Invoice["id"]) => {
  // --- state

  const { isAuthenticated, meta: sessionMeta } = useSession();

  const query = service.loadInvoice({ invoiceId });

  const meta = computed(() => ({
    isPaid:
      !isEmpty(query?.data?.value?.payments) &&
      query?.data?.value?.unpaid_amount === 0,
    isEmpty: isEmpty(query?.data?.value),
    hasError: !isEmpty(query?.error.value),
    isLoading: query?.isLoading.value || !query?.isFetched.value,
    isComplete: query?.isFetched.value,
    isAvailable: sessionMeta.value.isAuthenticated
  }));

  async function isReady(): Promise<boolean> {
    if (sessionMeta.value.isAuthenticated)
      return new Promise(resolve => {
        const interval = setInterval(() => {
          if (query?.isFetched.value) {
            clearInterval(interval);
            resolve(true);
          }
        }, 100);
      });
    return isAuthenticated()
      .then(() => query?.refetch().then(() => true) ?? false)
      .catch(() => false);
  }

  // --- context

  // --- methods

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
     * Meta-information about the invoice state.
     * Contains loading status, error state, and data availability.
     * @type {Object} Invoice meta information
     * @property {boolean} isLoading - Indicates if the invoice is currently loading.
     * @property {boolean} hasError - Indicates if there was an error during the query
     * @property {boolean} isEmpty - Indicates if the invoice data is empty.
     * @property {boolean} isAvailable - Indicates if the invoice is available.
     */
    meta,

    // --- context
    /**
     * The reactive data property containing the invoice details.
     * This is populated by the query and updates automatically when the query state changes.
     */
    data: query?.data,

    /**
     * The current error state of the query.
     * This will be populated if the query fails to fetch data.
     */
    error: query?.error,

    // --- methods

    invalidate: invalidateQueryByKey([service.queryKey, { invoiceId }], {
      exact: false
    })
  };
};

export type UseInvoice = ReturnType<typeof useInvoice>;
