import { computed } from "vue";
import { invalidateQueryByKey } from "../query";
import { useActiveSession } from "../session-store";
import service from "./invoices.service";
import { isEmpty, gt, eq } from "lodash-es";
import type { Invoice } from "./invoices.types";

/**
 * Composable function to manage the state and data for a single invoice.
 * Provides methods to load, access, and invalidate invoice data.
 *
 * @param {Invoice["id"]} invoiceId - The ID of the invoice to manage.
 * @returns The {@link UseInvoice} object containing reactive state, computed properties, and methods
 *  for interacting with the invoice data.
 */
export const useInvoice = (invoiceId: Invoice["id"]) => {
  // --- state

  const { isReady: ensureAuth } = useActiveSession().useActions();
  const { isAuthenticated } = useActiveSession().useMeta();

  const query = service.loadInvoice({ invoiceId });

  const meta = computed(() => ({
    isAuthenticated: isAuthenticated.value,
    isPaid:
      !isEmpty(query.data?.value?.payments) &&
      eq(query.data?.value?.summary.unpaidAmount, 0),
    isFree:
      isEmpty(query.data?.value?.payments) &&
      eq(query.data?.value?.summary.unpaidAmount, 0),
    isPartiallyPaid:
      gt(query.data?.value?.summary.paidAmount, 0) &&
      gt(query.data?.value?.summary.unpaidAmount, 0),
    isPending:
      isEmpty(query.data?.value?.payments) &&
      gt(query.data?.value?.summary.unpaidAmount, 0),
    isEmpty: isEmpty(query.data?.value),
    hasError: !isEmpty(query?.error.value),
    isFetching: query?.isFetching.value,
    isLoading: query?.isLoading.value || !query?.isFetched.value,
    isComplete: query?.isFetched.value,
    isAvailable: isAuthenticated.value
  }));

  async function isReady(): Promise<boolean> {
    if (isAuthenticated.value)
      return new Promise(resolve => {
        const interval = setInterval(() => {
          if (query?.isFetched.value) {
            clearInterval(interval);
            resolve(true);
          }
        }, 100);
      });
    return ensureAuth()
      .then(ok => (ok ? (query?.refetch().then(() => true) ?? false) : false))
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
    data: query.data,

    /**
     * The current error state of the query.
     * This will be populated if the query fails to fetch data.
     */
    error: query?.error,

    /**
     * Refetch the invoice data from the server.
     * Returns a promise that resolves when the refetch is complete.
     */
    refetch: query.refetch,

    // --- methods

    invalidate: invalidateQueryByKey([service.queryKey, { invoiceId }], {
      exact: false
    })
  };
};

/**
 * The return type of the {@link useInvoice} composable.
 */
export type UseInvoice = ReturnType<typeof useInvoice>;
