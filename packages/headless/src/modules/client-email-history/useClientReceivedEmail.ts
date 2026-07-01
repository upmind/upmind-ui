import { computed } from "vue";
import service from "./client-email-history.services";
import { isEmpty } from "lodash-es";
import type { EmailModel } from "../client-email";

/**
 * Composable function for managing client phones.
 * It handles fetching, displaying, filtering, and performing actions on client phones,
 * leveraging an underlying service and TanStack Query for data management.
 *
 * @param initial - Optional initial query parameters for loading the phone list. Defaults to pagination limit of 0.
 * @returns The {@link useClientReceivedEmail} API for interacting with client phones.
 */
export const useClientReceivedEmail = ({
  emailId
}: {
  emailId: EmailModel["id"];
}) => {
  // --- state
  const query = service.load({ emailId });

  const meta = computed(() => ({
    isLoading: query?.isLoading.value || !query?.isFetched.value,
    hasError: !isEmpty(query?.error.value),
    isEmpty: isEmpty(query.data.value?.id),
    isAvailable: true,
    isComplete: query?.isFetched.value,
    ...query?.data?.value?.meta // add any generated meta info here
  }));

  async function isReady(): Promise<boolean> {
    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (meta.value.isComplete) {
          clearInterval(interval);
          resolve(!meta.value.hasError);
        }
      }, 100);
    });
  }

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
     * @typedef {Object} ClientPhoneMeta
     * @property {boolean} isError - Indicates if there was an error during the query.
     * @property {boolean} isEmpty - Indicates if the basket is empty.
     * @property {boolean} isLoading - Indicates if the query is currently loading.
     * @property {boolean} isAuthenticated - Indicates if the client is authenticated.
     */
    meta,

    // --- methods

    /**
     * The reactive data property containing the list of client items.
     * This is populated by the query and updates automatically when the query state changes.
     */
    data: query.data,

    /**
     * The current error state of the query.
     * This will be populated if the query fails to fetch data.
     */
    error: query?.error,

    /**
     * Refresh the query to get the latest data.
     * This will refetch the data from the server and update the query state.
     * @returns {void}
     */
    refresh: query?.refetch
  };
};

/**
 * The return type of the {@link useClientReceivedEmail} composable function.
 */
export type useClientReceivedEmail = ReturnType<typeof useClientReceivedEmail>;
