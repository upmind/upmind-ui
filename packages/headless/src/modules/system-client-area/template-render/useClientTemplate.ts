import { computed } from "vue";
import {
  ClientAreaTemplateTypes,
  ClientTemplateSlotCodes
} from "@upmind-automation/types";
import { invalidateQueryByKey } from "../../query";
import service from "./template-render.services";
import { isEmpty } from "lodash-es";

// --- types

export { ClientTemplateSlotCodes };

/**
 * Composable function to manage the query, the state, and the context for client area templates.
 * Allows fetching, monitoring, and refreshing the data for client area templates.
 */
export const useClientTemplate = (params: {
  code?: ClientTemplateSlotCodes;
  objectId?: string;
}) => {
  // --- state

  const query = service.load(params);

  const meta = computed(() => ({
    isLoading: query?.isLoading.value || !query?.isFetched.value,
    hasError: !isEmpty(query?.error.value),
    isEmpty: isEmpty(query.data?.value),
    isAvailable: true,
    isIframe: query.data.value?.type
      ? [ClientAreaTemplateTypes.CLIENT_AREA_IFRAME].includes(
          query.data.value?.type
        )
      : false
  }));

  async function isReady(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      resolve(true);
    });
  }

  return {
    // --- state

    /**
     * Resolves when the client area templates are ready to be used.
     * Returns true if ready, false if an error occurred.
     * @returns {Promise<boolean>} A promise resolving to true if ready, false if error.
     */
    isReady,

    /**
     * Meta-information about the client area templates query.
     * @type {Object} ClientAreaTemplatesMeta
     * @property {boolean} isError - Indicates if there was an error during the query.
     * @property {boolean} isEmpty - Indicates if the query returned no results.
     * @property {boolean} isLoading - Indicates if the query is currently loading.
     */
    meta,

    // --- context

    /**
     * The reactive data property containing the list of client area templates.
     * This is populated by the query and can be used in templates.
     */
    data: query.data,

    /**
     * The current error state of the query.
     * This will be populated if the query fails to fetch data.
     */
    error: query?.error,

    // --- methods

    /**
     * Refresh the query to get the latest data.
     * This will refetch the data from the server and update the query state.
     * @returns {void}
     */
    refresh: query?.refetch,

    /**
     * Invalidate the query cache for the client area templates.
     * This will trigger a refetch of the items when the next query is made.
     * @param {boolean} [exact=false] If true, only the exact query key will be invalidated.
     * @return {void}
     */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false })
  };
};
