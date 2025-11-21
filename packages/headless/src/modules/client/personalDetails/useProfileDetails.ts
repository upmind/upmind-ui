// --- external
import { computed, ref } from "vue";

// --- internal
import { useSession } from "../../session";

import { useClientCustomFields } from "../../";

// --- utils
import { isEmpty } from "lodash-es";
import { useI18n } from "vue-i18n";

// --- types

import { mapProfileFields } from "./mappers";

/**
 * Composable function for managing client phones.
 * It handles fetching, displaying, filtering, and performing actions on client phones,
 * leveraging an underlying service and TanStack Query for data management.
 *
 * @param initial - Optional initial query parameters for loading the phone list. Defaults to pagination limit of 0.
 * @returns The {@link UseProfileDetails} API for interacting with client phones.
 */
export const useProfileDetails = () => {
  const { t } = useI18n();
  const { isAuthenticated, meta: sessionMeta, client } = useSession();

  const {
    isReady: customFieldsIsReady,
    data: customFields,
    meta: customFieldsMeta
  } = useClientCustomFields();

  async function isReady(): Promise<boolean> {
    if (sessionMeta.value.isAuthenticated)
      return new Promise(async resolve => {
        await customFieldsIsReady();
        resolve(true);
      });
    return isAuthenticated()
      .then(() => customFieldsIsReady().then(() => true))
      .catch(() => false);
  }

  const data = computed(() => {
    if (!client.value) return [];
    return mapProfileFields(client.value, customFields.value || []);
  });

  const meta = computed(() => ({
    isLoading:
      customFieldsMeta.value.isLoading || !sessionMeta.value.isAuthenticated,
    hasError: customFieldsMeta.value.hasError,
    isEmpty: isEmpty(data.value),
    isAvailable:
      sessionMeta.value.isAuthenticated && customFieldsMeta.value.isAvailable
  }));

  // --- context

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

    // --- context

    /**
     * The reactive data property containing the list of client items.
     * This is populated by the query and updates automatically when the query state changes.
     */
    data,

    customFields

    // --- methods
  };
};

/**
 * The return type of the {@link UseProfileDetails} composable function.
 */
export type UseProfileDetails = ReturnType<typeof useProfileDetails>;
