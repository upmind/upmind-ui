import { computed } from "vue";
import { invalidateQueryByKey } from "../../query";
import service from "./slots.services";
import { useCollection } from "../../../utils";
import { isEmpty, isArray } from "lodash-es";
import type { ClientTemplateSlot } from "./slots.types";

/**
 * Composable function to provide reactive state and methods to manage and interact with client area templates (slots).
 * This includes state management for query meta-information, error handling, data retrieval,
 * and operational methods such as fetching and invalidating data.
 */
export const useClientSlots = () => {
  // --- state
  const query = service.load();

  const meta = computed(() => ({
    isLoading: query?.isLoading.value || !query?.isFetched.value,
    hasError: !isEmpty(query?.error.value),
    isEmpty: isEmpty(query.data?.value),
    isAvailable: true
    // ...query?.meta.value
  }));

  async function isReady(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      resolve(true);
    });
  }

  // --- methods

  const { findOne, getOne } = useCollection<ClientTemplateSlot>(
    isArray(query.data.value) ? query.data.value : []
  );

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
     * Get a single client area template by id.
     * @param id The id of the client area template to get.
     * @return {ClientTemplateSlot | undefined} The client area template if found, otherwise undefined.
     */
    getOne,

    /**
     * Find a single client area template based on the given param. The param is matched against the title, code and description.
     * @param mapping The filter to match against the client area template title, code and description.
     * @return {ClientTemplateSlot | undefined} The client area template if found, otherwise undefined.
     */
    findOne,

    /**
     * Refresh the query to get the latest data.
     * This will refetch the data from the server and update the query state.
     * @returns {void}
     */
    refresh: () => query?.refetch(),

    /**
     * Invalidate the query cache for the client area templates.
     * This will trigger a refetch of the items when the next query is made.
     * @param {boolean} [exact=false] If true, only the exact query key will be invalidated.
     * @return {void}
     */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false })
  };
};
