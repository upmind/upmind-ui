// --- external
import { computed, ref, toRefs } from "vue";
import { useQuery, keepPreviousData } from "@tanstack/vue-query";

// --- internal
import service from "./services";
import { useTime } from "../../../utils";
import { useSession } from "../../session";
import { useFeedback } from "../../feedback";
import { invalidateQueryByKey } from "../../query";

// --- utils
import {
  get,
  find,
  every,
  filter,
  isEmpty,
  includes,
  isString,
  isNumber,
} from "lodash-es";

// --- types
import type { Address } from "./types";
import type { PaginatedParams } from "../../query";

export const useClientAddresses = (params: PaginatedParams) => {
  // --- state

  const { isAuthenticated } = useSession();
  const { addError, addSuccess } = useFeedback();
  const { sort, filters, pagination } = toRefs(params);

  const limit = pagination?.value?.limit;
  const offset = pagination?.value?.offset;

  /**
   * The current page number based on the limit and offset.
   * If limit and offset are not provided, it defaults to -1.
   * -1 indicates that pagination is not set and the user wants all addresses.
   */
  const page = ref<number>(
    limit && offset ? Math.ceil(offset / limit) + 1 : -1
  );

  const hasPagination = page.value > -1;

  const query = useQuery<Address[]>({
    queryKey: computed(() => [
      ...service.queryKey,
      {
        sort: sort?.value,
        filters: filters?.value,
        pagination: pagination?.value,
        page: hasPagination ? page.value : undefined,
      },
    ]),
    queryFn: () =>
      hasPagination
        ? service.loadPaged({
            sort: sort?.value,
            filters: filters?.value,
            pagination: pagination?.value,
          })
        : service.loadAll(),
    staleTime: useTime().DAY,
    placeholderData: keepPreviousData,
  });

  async function isReady(): Promise<boolean> {
    return isAuthenticated()
      .then(() => true)
      .catch(() => false);
  }

  const meta = computed(() => ({
    isError: !isEmpty(query.error),
    isEmpty: isEmpty(query?.data?.value),
    isLoading: query?.fetchStatus.value === "fetching",
  }));

  // --- methods

  function getOne(id: Address["id"]) {
    const addresses = getAllFromCache();
    return find(addresses, ["id", id]);
  }

  async function getAll() {
    return service.loadAll();
  }

  async function getPaged(paginationParams: PaginatedParams) {
    return service.loadPaged(paginationParams);
  }

  function getAllFromCache() {
    return service.loadAllFromCache();
  }

  function findOne(mapping: string | Partial<Address>) {
    const addresses = getAllFromCache();
    if (isString(mapping)) {
      return find(
        addresses,
        item =>
          includes(item.title.toLowerCase(), mapping.toLowerCase()) ||
          includes(item.description.toLowerCase(), mapping.toLowerCase())
      );
    }

    return find(addresses, item =>
      every(mapping, (value, key) => {
        if (key == "id") {
          return item.id == value;
        }
        const modelValue = get(item, key);
        return modelValue == value;
      })
    );
  }

  function filterAddresses(param: string) {
    const addresses = getAllFromCache();
    return filter(
      addresses,
      item =>
        includes(item.title.toLowerCase(), param.toLowerCase()) ||
        includes(item.description.toLowerCase(), param.toLowerCase())
    );
  }

  async function remove(id: Address["id"]) {
    return service
      .remove(id)
      .then(() => addSuccess("Successfully removed address"))
      .then(service.refresh)
      .catch(error =>
        addError({
          title: isString(error)
            ? error
            : error?.title || "We experienced an error removing this address",
          copy: error?.message,
          data: error?.data,
        })
      );
  }

  async function getDefault() {
    return getAll().then(items => find(items, "meta.isDefault"));
  }

  async function setDefault(id: Address["id"]) {
    return service
      .setDefault(id)
      .then(() => addSuccess("Successfully set address as default"))
      .then(service.refresh)
      .catch(error => {
        addError({
          title: isString(error)
            ? error
            : error?.title ||
              "We experienced an error setting this address as default",
          copy: error?.message,
          data: error?.data,
        });
      });
  }

  function nextPage() {
    if (!pagination?.value) return;

    const { limit, offset } = pagination.value;

    if (isNumber(limit) && isNumber(offset)) {
      pagination.value.offset = offset + limit;
    }
  }

  function prevPage() {
    if (!pagination?.value) return;

    const { limit, offset } = pagination.value;

    if (isNumber(limit) && isNumber(offset) && offset >= limit) {
      pagination.value.offset = offset - limit;
    }
  }

  return {
    // --- state

    /**
     * Resolves when the client addresses are ready to be used.
     * Returns true if ready, false if an error occurred.
     * @returns {Promise<boolean>} A promise resolving to true if ready, false if error.
     */
    isReady,

    /**
     * Computed meta-information about the addresses.
     */
    meta,

    /**
     * The current page number.
     * If pagination is not set, it defaults to -1.
     */
    page,

    // --- methods

    /**
     * Get a single address by id.
     * @param id The id of the address to get.
     * @returns The address object if found, is otherwise undefined.
     */
    getOne,

    /**
     * Get all the addresses for the current client.
     * @returns An array of parsed addresses if found, otherwise an empty array.
     */
    getAll,

    /**
     * Get addresses in a paged format.
     * @param paginationParams The pagination parameters to use.
     * @returns A promise that resolves to an object containing the addresses and pagination details.
     */
    getPaged,

    /**
     * Get all the addresses from the cache.
     * @returns An array of parsed addresses if found, otherwise an empty array.
     */
    getAllFromCache,

    /**
     * Find a single address based on the given param. The param is matched against the title and description.
     * @param mapping The filter to match against the address title and description.
     * @returns The address object if found, is otherwise undefined.
     */
    findOne,

    /**
     * Filters the addresses by name or description.
     * @param param The filter string to filter the addresses with.
     * @returns An array of addresses that match the filter.
     */
    filter: filterAddresses,

    /**
     * Remove an address by id.
     * @param id The id of the address to remove.
     * @returns A promise that resolves when the address is removed.
     */
    remove,

    /**
     * Get the default address for the current client.
     * @returns The default address if found, is otherwise undefined.
     */
    getDefault,

    /**
     * Set an address as default.
     * @param id The id of the address to set as default.
     * @returns A promise that resolves when the address is set as default.
     */
    setDefault,

    /**
     * Go to the next page of addresses.
     * Increments the page number by 1 if pagination is enabled and the current offset is less than the total number of addresses.
     */
    nextPage,

    /**
     * Go to the previous page of addresses.
     * Decrements the page number by 1 if pagination is enabled and the current offset is greater than or equal to the limit.
     */
    prevPage,

    /**
     * Invalidate the query cache for client addresses.
     */
    invalidate: invalidateQueryByKey(service.queryKey),
  };
};

export type UseClientAddresses = ReturnType<typeof useClientAddresses>;
