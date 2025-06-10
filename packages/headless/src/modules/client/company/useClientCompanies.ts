// --- external
import { ref, computed } from "vue";
import { useQuery, keepPreviousData } from "@tanstack/vue-query";

// --- internal
import service from "./services";
import { useTime } from "../../../utils";
import { useSession } from "../../session";
import { invalidateQueryByKey } from "../../query";

// --- utils
import { find, filter, includes, isEmpty, isNumber } from "lodash-es";

// --- types
import type { Company } from "./types";
import type { PaginatedParams, IAPIPagination } from "../../query";

export const useClientCompanies = (params: PaginatedParams = {}) => {
  // --- state

  const { isAuthenticated } = useSession();

  const pagination = ref<IAPIPagination | undefined>(params.pagination);

  const page = computed(() => {
    const limit = pagination.value?.limit;
    const offset = pagination.value?.offset;
    return limit && offset !== undefined ? Math.floor(offset / limit) + 1 : -1;
  });

  const hasPagination = computed(() => page.value > -1);

  const query = useQuery<Company[]>({
    queryFn: () =>
      hasPagination.value
        ? service.loadPaged({ pagination: pagination.value })
        : service.loadAll(),
    queryKey: computed(() => [
      ...service.queryKey,
      { pagination: pagination.value },
    ]),
    staleTime: useTime().DAY,
    placeholderData: keepPreviousData,
  });

  const meta = computed(() => ({
    isError: !isEmpty(query.error.value),
    isEmpty: isEmpty(query?.data?.value),
    isLoading: query?.fetchStatus.value === "fetching",
  }));

  async function isReady(): Promise<boolean> {
    return isAuthenticated()
      .then(() => true)
      .catch(() => false);
  }

  // --- methods

  function getOne(id: Company["id"]) {
    const companies = getAllFromCache();
    return find(companies, ["id", id]);
  }

  function getAllFromCache() {
    return service.loadAllFromCache();
  }

  function findOne(param: string) {
    const companies = getAllFromCache();
    return find(
      companies,
      item =>
        includes(item.name.toLowerCase(), param.toLowerCase()) ||
        includes(item.description.toLowerCase(), param.toLowerCase())
    );
  }

  function filterCompanies(param: string) {
    const companies = getAllFromCache();
    return filter(
      companies,
      item =>
        includes(item.name.toLowerCase(), param.toLowerCase()) ||
        includes(item.description.toLowerCase(), param.toLowerCase())
    );
  }

  async function remove(id: Company["id"]) {
    return service.remove(id);
  }

  function getDefault() {
    return find(query.data.value, "meta.isDefault");
  }

  async function setDefault(id: Company["id"]) {
    return service.setDefault(id);
  }

  function nextPage() {
    const limit = pagination.value?.limit;
    const offset = pagination.value?.offset ?? 0;

    if (isNumber(limit)) {
      pagination.value = {
        ...pagination.value,
        offset: offset + limit,
      };
    }
  }

  function prevPage() {
    const limit = pagination.value?.limit;
    const offset = pagination.value?.offset ?? 0;

    if (isNumber(limit) && offset >= limit) {
      pagination.value = {
        ...pagination.value,
        offset: offset - limit,
      };
    }
  }

  function setPagination(value: IAPIPagination) {
    pagination.value = { ...pagination.value, ...value };
  }

  return {
    // --- state

    /**
     * Checks if the client 'companies' data is ready to be used.
     * This resolves to true if the user is authenticated and the query is ready.
     * @return A promise that resolves to a boolean indicating readiness.
     */
    isReady,

    /**
     * Computed meta-information about the companies.
     */
    meta,

    /**
     * The current page number.
     * If pagination is not set, it defaults to -1.
     */
    page,

    /**
     * The reactive data property containing the list of client companies.
     * This is populated by the query and updates automatically when the query state changes.
     */
    data: query.data,

    /**
     * Indicates if pagination is available.
     * If pagination is not set, it defaults to false.
     */
    pagination,

    // --- methods

    /**
     * Resolves when the client companies are ready to be used.
     * Returns true if ready, false if an error occurred.
     * @returns {Promise<boolean>} A promise resolving to true if ready, false if error.
     */
    getOne,

    /**
     * Get all client companies from the cache.
     * This is useful for accessing the cached data without making a new request.
     * @returns An array of all client companies.
     */
    getAllFromCache,

    /**
     * Finds a single company by its name or description.
     * @param param The name or description to search for.
     * @returns The company object if found, is otherwise undefined.
     */
    findOne,

    /**
     * Filters companies based on a search parameter.
     * @param param The name or description to filter by.
     * @returns An array of companies that match the search parameter.
     */
    filter: filterCompanies,

    /**
     * Remove a company by its id.
     * @param id The id of the company to remove.
     * @returns A promise that resolves when the company is removed.
     */
    remove,

    /**
     * Get the default company.
     * This retrieves the company marked as default from the list of companies.
     * @returns A promise that resolves to the default company if found, otherwise undefined.
     */
    getDefault,

    /**
     * Set a company as the default company.
     * @param id The id of the company to set as default.
     * @returns A promise that resolves when the default company is set.
     */
    setDefault,

    /**
     * Go to the next page of companies.
     * Increments the page number by 1 if pagination is enabled.
     * This will only work if the current offset is less than the total number of companies.
     * @param {number} [limit] The number of companies per page, defaults to the current pagination limit.
     * @return {void}
     */
    nextPage,

    /**
     * Go to the previous page of companies.
     * Decrements the page number by 1 if pagination is enabled and the current offset is greater than or equal to the limit.
     * This will only work if the current offset is greater than or equal to the limit.
     * @param {number} [limit] The number of companies per page, defaults to the current pagination limit.
     * @return {void}
     */
    prevPage,

    /**
     * Set the pagination parameters.
     * This updates the current pagination state with the provided values.
     * @param value The new pagination parameters to set.
     * @return {void}
     */
    setPagination,

    /**
     * Invalidate the query cache for client companies.
     * This will trigger a refetch of the companies when the next query is made.
     * @param {boolean} [exact=false] If true, only the exact query key will be invalidated.
     * @return {void}
     */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),
  };
};

export type UseClientCompanies = ReturnType<typeof useClientCompanies>;
