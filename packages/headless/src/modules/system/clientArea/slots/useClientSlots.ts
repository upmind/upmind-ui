// --- external
import { computed } from "vue";

// --- internal
import service from "./services";

// --- utils
import { filter, isEmpty, includes } from "lodash-es";

// --- types
import { useCollection } from "../../../../utils";
import type { ClientTemplateSlot } from "./types";
import { type QueryProps, invalidateQueryByKey } from "../../../query";

export const useClientSlots = (initial?: QueryProps) => {
  // --- state
  const query = service.load(initial);

  const meta = computed(() => ({
    isLoading: query?.isLoading.value || !query.isFetched.value,
    hasError: !isEmpty(query.error.value),
    isEmpty: isEmpty(query?.data?.value),
    isAvailable: true,
    ...query?.meta.value
  }));

  async function isReady(): Promise<boolean> {
    return new Promise<boolean>(resolve => {
      resolve(true);
    });
  }

  // --- methods

  const { findOne, getOne } = useCollection<ClientTemplateSlot>(
    query.data.value ?? []
  );

  function filterAll(param?: ClientTemplateSlot["id"]) {
    if (!param) return query.data.value ?? [];

    return filter(
      query.data.value ?? [],
      item =>
        includes(item.title.toLowerCase(), param.toLowerCase()) ||
        includes(item?.code?.toLowerCase(), param.toLowerCase()) ||
        includes(item?.description?.toLowerCase(), param.toLowerCase())
    );
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
    error: query.error,

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
     * Filters the client area templates by name, code or description.
     * @param param The string to filter the client area templates by.
     * @return {ClientTemplateSlot[]} An array of client area templates that match the filter.
     */
    filter: filterAll,

    /**
     * Refresh the query to get the latest data.
     * This will refetch the data from the server and update the query state.
     * @returns {void}
     */
    refresh: query.refetch,

    /**
     * Go to the next page of items.
     * Increments the page number by 1 if pagination is enabled and the current offset is less than the total number of items.
     * This will only work if the current offset is less than the total number of items.
     * @param value The new pagination parameters to set.
     * @return {void}
     */
    nextPage: query.fetchNextPage,

    /**
     * Go to the previous page of items.
     * Decrements the page number by 1 if pagination is enabled and the current offset is greater than or equal to the limit.
     * This will only work if the current offset is greater than or equal to the limit.
     * @param value The new pagination parameters to set.
     * @return {void}
     */
    prevPage: query.fetchPreviousPage,

    /**
     * Invalidate the query cache for the client area templates.
     * This will trigger a refetch of the items when the next query is made.
     * @param {boolean} [exact=false] If true, only the exact query key will be invalidated.
     * @return {void}
     */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false })
  };
};
