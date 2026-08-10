import { computed } from "vue";
import { invalidateQueryByKey } from "../query";
import { useActiveSession } from "../session-store";
import service from "./client-phone.services";
import { useCollection } from "../../utils";
import { isEmpty, isArray } from "lodash-es";
import type { Phone, PhoneQueryModel } from "./client-phone.types";

/**
 * Composable function for managing client phones.
 * It handles fetching, displaying, filtering, and performing actions on client phones,
 * leveraging an underlying service and TanStack Query for data management.
 *
 * @param initial - The starting query model (filters · pagination). Untrusted;
 * it takes the same parse → validate path as any criteria write.
 * @returns The {@link UseClientPhones} API for interacting with client phones.
 */
export const useClientPhones = (initial?: Partial<PhoneQueryModel>) => {
  // --- state

  const { isReady: ensureAuth } = useActiveSession().useActions();
  const { isAuthenticated } = useActiveSession().useMeta();

  const query = service.loadList(initial);

  const meta = computed(() => ({
    isLoading: query?.isLoading.value || !query.isFetched.value,
    hasError: !isEmpty(query.error.value),
    isEmpty: isEmpty(query.data?.value) || query.pagination.value.total == 0,
    isAvailable: isAuthenticated.value,
    ...query?.meta.value
  }));

  const { findOne, getOne, getDefault } = useCollection<Phone>(query.data);

  async function isReady(): Promise<boolean> {
    if (isAuthenticated.value)
      return new Promise(resolve => {
        const interval = setInterval(() => {
          if (query.isFetched.value) {
            clearInterval(interval);
            resolve(true);
          }
        }, 100);
      });
    return ensureAuth()
      .then(ok => (ok ? query.refetch().then(() => true) : false))
      .catch(() => false);
  }

  // --- context

  // --- mutations

  function remove(id: Phone["id"]) {
    return service.remove(id).mutate();
  }

  function setDefault(id: Phone["id"]) {
    return service.setDefault(id).mutate();
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

    // --- context

    /**
     * The reactive data property containing the list of client items.
     * This is populated by the query and updates automatically when the query state changes.
     */
    data: computed(() => (isArray(query.data.value) ? query.data.value : [])),

    /**
     * The current error state of the query.
     * This will be populated if the query fails to fetch data.
     */
    error: query.error,

    /**
     * Indicates if pagination is available
     * If pagination is not set, it defaults to false.
     * Otherwise, it returns the pagination object from the query parameters.
     * @return {boolean|RequestPagination} The pagination object if available, otherwise false.
     */
    pagination: query.pagination,

    /**
     * The default item for the current client.
     * This is the phone that is set as default for the current client.
     * @returns {Phone} The default phone if found, is otherwise undefined.
     */
    default: getDefault,

    // --- methods

    /**
     * Get a single phone by id.
     * @param id The id of the phone to get.
     * @returns The phone object if found, is otherwise undefined.
     */
    getOne,

    /**
     * Find a single phone based on the given param. The param is matched against the title and description.
     * @param mapping The filter to match against the phone title and description.
     * @returns The phone object if found, is otherwise undefined.
     */
    findOne,

    /**
     * Remove a phone by id.
     * @param id The id of the phone to remove.
     * @returns A promise that resolves when the phone is removed.
     */
    remove,

    /**
     * Set a phone as default.
     * @param id The id of the phone to set as default.
     * @returns A promise that resolves when the phone is set as default.
     */
    setDefault,

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
     * Invalidate the query cache for client items.
     * This will trigger a refetch of the items when the next query is made.
     * @param {boolean} [exact=false] If true, only the exact query key will be invalidated.
     * @return {void}
     */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),

    // --- criteria

    /**
     * The collection's request state — filters · pagination — as the
     * schema-validated model. Read-only; write through {@link setCriteria}.
     */
    criteria: query.criteria,

    /** What is filterable and sortable at all. */
    schema: query.schema,

    /** Any declared filter column carries a value. */
    isFiltered: query.isFiltered,

    /** ajv's verdict on the last REJECTED criteria write — not a fetch failure. */
    criteriaError: query.criteriaError,

    /**
     * The ONE write verb for the request state. Merges at BRANCH level, and a
     * write that changes the result set returns to the first page.
     */
    setCriteria: query.setCriteria
  };
};

/**
 * The return type of the {@link useClientPhones} composable function.
 */
export type UseClientPhones = ReturnType<typeof useClientPhones>;
