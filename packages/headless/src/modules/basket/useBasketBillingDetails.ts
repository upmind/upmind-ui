// --- external
import { computed } from "vue";
import { useQuery, invalidateQueryByKey } from "../query";
import {
  find,
  filter,
  includes,
  isString,
  every,
  get,
  has,
  isNil,
} from "lodash-es";

// --- internal
import { useSession } from "../session";
import service from "./billing/unifiedAddress/services";
import { useFeedback } from "../feedback";
import { useClientAddresses, useClientCompanies } from "../client";

// --- types
import type { UnifiedAddress } from "./billing";

// -----------------------------------------------------------------------------

/**
 * Composable for managing all billing details (unified addresses).
 * @returns DEVX-compliant composable for all billing details.
 */
export const useBasketBillingDetails = () => {
  const { addError } = useFeedback();
  const { queryClient } = useQuery();
  const { meta: sessionMeta } = useSession();

  // --- state
  async function isReady(): Promise<boolean> {
    // This is a placeholder for session authentication check
    return new Promise(resolve =>
      setTimeout(() => {
        if (sessionMeta.value.isAuthenticated) {
          resolve(true);
        }
      }, 100)
    );
  }
  // --- state
  const meta = computed(() => ({
    isAvailable: sessionMeta.value.isAuthenticated,
  }));

  // --- context
  const data = computed(() => getCached());

  // --- methods

  async function getAll() {
    const { data: addresses } = useClientAddresses();
    const { getAll: getCompanies } = useClientCompanies();
    return Promise.all([getCompanies()]).then(([companies]) => {
      const unifiedAddresses = [...companies, ...(addresses.value || [])];
      queryClient.setQueryData(service.queryKey, {
        data: unifiedAddresses,
        meta: {
          isStale: false,
          isInvalid: false,
        },
      });
      return unifiedAddresses;
    });
  }

  function getCached() {
    const unifiedAddressesQuery = queryClient.getQueryData<{
      data: UnifiedAddress[];
    }>(service.queryKey);
    return unifiedAddressesQuery?.data || [];
  }

  function getOne(id: string) {
    const unifiedAddresses = getCached();
    return find(unifiedAddresses, ["id", id]);
  }

  function findOne(mapping: string | Partial<UnifiedAddress>) {
    const unifiedAddresses = getCached();
    if (isString(mapping)) {
      return find(
        unifiedAddresses,
        item =>
          includes(item.title.toLowerCase(), mapping.toLowerCase()) ||
          includes(item.description.toLowerCase(), mapping.toLowerCase())
      );
    }
    return find(unifiedAddresses, item =>
      every(mapping, (value, key) => {
        if (key == "id") {
          return item.id == value;
        }
        const modelValue = get(item, key);
        return modelValue == value;
      })
    );
  }

  function filterUnifiedAddresses(param: string) {
    const addresses = getCached();
    return filter(
      addresses,
      item =>
        includes(item.title.toLowerCase(), param.toLowerCase()) ||
        includes(item.description.toLowerCase(), param.toLowerCase())
    );
  }

  async function getDefault() {
    return getAll().then(items => find(items, "meta.isDefault"));
  }

  async function remove(id: string) {
    const { remove: removeAddress } = useClientAddresses();
    const { remove: removeCompany } = useClientCompanies();
    const unifiedAddress = getOne(id);
    if (isNil(unifiedAddress)) {
      return addError({
        title: "Address not found",
        copy: "The address you are trying to remove was not found.",
      });
    }
    return has(unifiedAddress, "addressId")
      ? removeCompany(id).then(refresh)
      : removeAddress(id).then(refresh);
  }

  async function setDefault(id: string) {
    const { setDefault: setAddressAsDefault } = useClientAddresses();
    const { setDefault: setCompanyAsDefault } = useClientCompanies();
    const unifiedAddress = getOne(id);
    if (isNil(unifiedAddress)) {
      return addError({
        title: "Address not found",
        copy: "The address you are trying to set as default was not found.",
      });
    }
    return has(unifiedAddress, "addressId")
      ? setCompanyAsDefault(id).then(refresh)
      : setAddressAsDefault(id).then(refresh);
  }

  async function refresh() {
    return getAll();
  }

  async function invalidate() {
    await invalidateQueryByKey(service.queryKey)(null);
    const { invalidate: invalidateAddresses } = useClientAddresses();
    const { invalidate: invalidateCompanies } = useClientCompanies();
    await Promise.all([invalidateAddresses(null), invalidateCompanies(null)]);
  }

  // ---------------------------------------------------------------------------

  return {
    // --- state

    /**
     * Check if the user is authenticated and billing details are ready to be fetched.
     * @returns {Promise<boolean>} Resolves to true when the unified addresses are ready to be fetched.
     * @example isReady().then(getAll).then(() => console.log("Details are ready"))
     */
    isReady,

    // --- context

    /**
     * The reactive billing details data.
     */
    data,

    /**
     * Meta information about the billing details state.
     */
    meta,

    // --- methods

    /**
     * Removes a billing detail by id.
     * @param {string} id The id of the billing detail to remove.
     * @returns {Promise<void>} Resolves when the billing detail is removed.
     */
    remove,

    /**
     * Sets a billing detail as default.
     * @param {string} id The id of the billing detail to set as default.
     * @returns {Promise<void>} Resolves when the billing detail is set as default.
     */
    setDefault,

    /**
     * Gets the default billing detail.
     * @returns {Promise<UnifiedAddress|undefined>} Resolves with the default billing detail if found, otherwise undefined.
     */
    getDefault,

    /**
     * Gets all billing details from cache.
     * @returns {UnifiedAddress[]} The cached billing details.
     */
    getCached,

    /**
     * Gets all billing details.
     * @param {object} [options] Options for fetching billing details.
     * @param {boolean} [options.allowStale=true] Whether to allow stale data.
     * @returns {Promise<UnifiedAddress[]>} Resolves with all billing details.
     */
    getAll,

    /**
     * Filters billing details by string.
     * @param {string} param The filter string.
     * @returns {UnifiedAddress[]} The filtered billing details.
     */
    filter: filterUnifiedAddresses,

    /**
     * Gets a billing detail by id.
     * @param {string} id The id of the billing detail.
     * @returns {UnifiedAddress|undefined} The billing detail if found, otherwise undefined.
     */
    getOne,

    /**
     * Finds a billing detail by mapping.
     * @param {string | Partial<UnifiedAddress>} mapping The filter to match against the billing detail.
     * @returns {UnifiedAddress|undefined} The billing detail if found, otherwise undefined.
     */
    findOne,

    /**
     * Invalidates the billing details cache.
     * @returns {Promise<void>} Resolves when invalidated.
     */
    invalidate,

    /**
     * Refreshes the billing details from the server.
     * @returns {Promise<UnifiedAddress[]>} Resolves with the refreshed billing details.
     */
    refresh,
  };
};

/**
 * The return type of useBasketBillingDetails composable.
 */
export type UseBasketBillingDetails = ReturnType<
  typeof useBasketBillingDetails
>;
