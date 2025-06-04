// --- external
import { ref, computed } from "vue";
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
  isEqual,
  isEmpty,
  isString,
  includes,
  isNumber,
} from "lodash-es";

// --- types
import type { Email } from "./types";
import type { PaginatedParams, IAPIPagination } from "../../query";

export const useClientEmails = (params: PaginatedParams = {}) => {
  // --- state

  const { isAuthenticated } = useSession();
  const { addError, addSuccess } = useFeedback();

  const pagination = ref<IAPIPagination | undefined>(params.pagination);

  const page = computed(() => {
    const limit = pagination.value?.limit;
    const offset = pagination.value?.offset;
    return limit && offset !== undefined ? Math.floor(offset / limit) + 1 : -1;
  });

  const hasPagination = computed(() => page.value > -1);

  const query = useQuery<Email[]>({
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

  /**
   * Check if the client addresses are loaded and ready.
   * @returns A promise that resolves to true when the addresses are ready to be fetched.
   */
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

  function getOne(id: Email["id"]) {
    return find(getAllFromCache(), ["id", id]);
  }

  async function getAll() {
    return service.loadAll();
  }

  async function getPaged(params: PaginatedParams) {
    return service.loadPaged(params);
  }

  function getAllFromCache() {
    return service.loadAllFromCache();
  }

  function findOne(mapping: string | Partial<Email>) {
    const emails = getAllFromCache();
    if (isString(mapping)) {
      return find(emails, item =>
        includes(item.email.toLowerCase(), mapping.toLowerCase())
      );
    }

    return find(emails, item =>
      every(mapping, (value, key) => {
        if (key == "id") {
          return item.id == value;
        } else {
          const modelValue = get(item, key);
          return modelValue == value;
        }
      })
    );
  }

  function filterEmails(param: string) {
    return filter(
      getAllFromCache(),
      item => isEqual(item.id, param) || isEqual(item.email, param)
    );
  }

  async function remove(id: Email["id"]) {
    return service
      .remove(id)
      .then(() => addSuccess("Successfully removed email"))
      .then(service.refresh)
      .catch(error =>
        addError({
          title: isString(error)
            ? error
            : error?.title || "We experienced an error removing this email",
          copy: error?.message,
          data: error?.data,
        })
      );
  }

  async function getDefault() {
    return getAll().then(items => find(items, "meta.isDefault"));
  }

  async function setDefault(id: Email["id"]) {
    return service
      .setDefault(id)
      .then(() => addSuccess("Successfully set email as default"))
      .then(service.refresh)
      .catch(error => {
        addError({
          title: isString(error)
            ? error
            : error?.title ||
              "We experienced an error setting this email as default",
          copy: error?.message,
          data: error?.data,
        });
      });
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
    /**
     * Resolves when the client emails are ready to be used.
     * Returns true if ready, false if an error occurred.
     * @returns {Promise<boolean>} A promise resolving to true if ready, false if error.
     */
    isReady,

    /**
     * Computed meta-information about the emails.
     */
    meta,

    /**
     * The current page number.
     * If pagination is not set, it defaults to -1.
     */
    page,

    /**
     * Indicates if pagination is available.
     * If pagination is not set, it defaults to false.
     */
    pagination,

    // --- methods

    /**
     * Get a single email by id.
     * @param id The id of the email to get.
     * @returns A promise that resolves to an email or undefined.
     */
    getOne,

    /**
     * Get all the emails for the current client.
     * @returns A promise that resolves to an array of emails.
     */
    getAll,

    /**
     * Get emails in a paged format.
     * @param params The pagination parameters to use.
     * @returns A promise that resolves to an object containing the emails and pagination details.
     */
    getPaged,

    /**
     * Get all the emails for the client from the cache.
     * @returns A promise that resolves to an array of emails.
     */
    getAllFromCache,

    /**
     * Find a single email based on the given param. The param is matched against the id and email.
     * @param mapping The filter to match against the email id and email.
     * @returns A promise that resolves to an email or undefined.
     */
    findOne,

    /**
     * Filter the emails by id or email.
     * @param param The id or email to filter by.
     * @returns A promise that resolves to an array of emails.
     */
    filter: filterEmails,

    /**
     * Remove an email by id.
     * @param id The id of the email to remove.
     * @returns A promise that resolves to the removed email.
     */
    remove,

    /**
     * Get the default email for the client.
     * @returns A promise that resolves to an email or undefined.
     */
    getDefault,

    /**
     * Set an email as default.
     * @param id The id of the email to set as default.
     * @returns A promise that resolves to the updated email.
     */
    setDefault,

    /**
     * Go to the next page of emails.
     * Increments the page number by 1 if pagination is enabled and the current offset is less than the total number of emails.
     */
    nextPage,

    /**
     * Go to the previous page of emails.
     * Decrements the page number by 1 if pagination is enabled and the current offset is greater than or equal to the limit.
     */
    prevPage,

    /**
     * Set the pagination parameters.
     * @param value The new pagination parameters to set.
     */
    setPagination,

    /**
     * Invalidate the query cache for client emails.
     */
    invalidate: invalidateQueryByKey(service.queryKey, { exact: false }),
  };
};

export type UseClientEmails = ReturnType<typeof useClientEmails>;
