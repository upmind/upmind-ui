// --- internal
import { useQuery, invalidateQueryByKey } from "../../query";
import service from "./unifiedAddress/services";
import { useTime } from "../../../utils";
import { useSession } from "../../session";
import { useFeedback } from "../../feedback";
import { useClientAddresses, useClientCompanies } from "../../client";

// --- utils
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

// --- types
import type { UnifiedAddress } from "./unifiedAddress";
import { useBrand } from "../../brand";
import { BrandConfigKeys } from "@upmind-automation/types";

export const useBillingDetails = () => {
  const { addError } = useFeedback();
  const { queryClient } = useQuery();
  const { isAuthenticated } = useSession();
  const { ensureConfig, getConfig } = useBrand();

  /**
   * Check if the unified addresses are loaded and ready
   * @returns A promise that resolves to true when the unified addresses are ready to be fetched.
   * @example isReady().then(getAll).then(() => console.log("Details are ready"))
   */
  async function isReady(): Promise<boolean> {
    await ensureConfig(BrandConfigKeys.CHECKOUT_REQUIRE_PHONE);
    await ensureConfig(BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS);

    return isAuthenticated()
      .then(() => true)
      .catch(() => false);
  }

  /**
   * Get all the unified addresses.
   * @param allowStale Whether to allow stale data. Defaults to true.
   * @returns An array of parsed unified addresses if found, otherwise an empty array.
   * @example getAll().then(address => console.log(address))
   */
  async function getAll({ allowStale = true } = {}) {
    const { getAll: getAddresses } = useClientAddresses();
    const { getAll: getCompanies } = useClientCompanies();

    return (
      // Fetch addresses and companies in parallel
      Promise.all([
        getCompanies({ allowStale }),
        getAddresses({ allowStale }),
      ]).then(([companies, addresses]) => {
        // we prioritise/return the companies first so they are at the top of the list
        const unifiedAddresses = [...companies, ...addresses];

        // Cache the combined data under the unified-addresses key
        queryClient.setQueryData(service.queryKey, {
          data: unifiedAddresses,
          meta: {
            isStale: false,
            isInvalid: false,
          },
        });

        return unifiedAddresses;
      })
    );
  }

  /**
   * Get all the unified addresses from the cache.
   * @returns An array of parsed unified addresses if found, otherwise an empty array.
   * @example getCached().then((addresses) => console.log(addresses))
   */
  function getCached() {
    const unifiedAddressesQuery = queryClient.getQueryData<{
      data: UnifiedAddress[];
    }>(service.queryKey);
    return unifiedAddressesQuery?.data || [];
  }

  /**
   * Get a single unified address by id.
   * @param id The id of the unified address to get.
   * @returns The unified address object if found, otherwise undefined.
   * @example getOne("123").then((address) => console.log(address))
   */
  function getOne(id: string) {
    const unifiedAddresses = getCached();
    return find(unifiedAddresses, ["id", id]);
  }

  /**
   * Find a single unified address based on the given param. The param is matched against the title and description.
   * @param mapping The filter to match against the unified address title and description.
   * @returns The unified address object if found, otherwise undefined.
   * @example findOne("home").then((address) => console.log(address))
   */
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

  /**
   * Filters the unified addresses by name or description.
   * @param param The filter string to filter the unified addresses with.
   * @returns An array of unified addresses that match the filter.
   * @example filter("home").then((addresses) => console.log(addresses))
   */
  function filterUnifiedAddresses(param: string) {
    const addresses = getCached();
    return filter(
      addresses,
      item =>
        includes(item.title.toLowerCase(), param.toLowerCase()) ||
        includes(item.description.toLowerCase(), param.toLowerCase())
    );
  }

  /**
   * Get the default address for the current client.
   * @returns The default address if found, otherwise undefined.
   * @example getDefault().then((address) => console.log(address))
   */
  async function getDefault() {
    return getAll().then(items => find(items, "meta.isDefault"));
  }

  async function refresh() {
    return getAll({ allowStale: false });
  }

  /**
   * Remove a unified address by id.
   * @param id The id of the unified address to remove.
   * @returns A promise that resolves when the unified address is removed.
   * @example remove("123").then(() => console.log("Address removed"))
   */
  async function remove(id: string) {
    const { remove: removeAddress } = useClientAddresses();
    const { remove: removeCompany } = useClientCompanies();

    // In order to remove an address, we need to check if the address is a company address
    const unifiedAddress = getOne(id);

    // Check if the address was found
    if (isNil(unifiedAddress)) {
      return addError({
        title: "Address not found",
        copy: "The address you are trying to remove was not found.",
      });
    }

    // remove company and remove address already handle error and success messages
    return has(unifiedAddress, "addressId")
      ? removeCompany(id).then(refresh)
      : removeAddress(id).then(refresh);
  }

  /**
   * Set an address as default.
   * @param id The id of the address to set as default.
   * @returns A promise that resolves when the address is set as default.
   * @example setDefault("123").then(() => console.log("Address set as default"))
   */
  async function setDefault(id: string) {
    const { setDefault: setAddressAsDefault } = useClientAddresses();
    const { setDefault: setCompanyAsDefault } = useClientCompanies();

    // In order to set an address as default, we need to check if the address is a company address
    const unifiedAddress = getOne(id);

    // Check if the address was found
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

  const meta = () => {
    const config = getConfig([
      BrandConfigKeys.CHECKOUT_REQUIRE_PHONE,
      BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS,
    ]);

    return {
      requiresAddress: get(config, BrandConfigKeys.REQUIRE_ADDRESS_FOR_ORDERS),
      requiresPhone: get(config, BrandConfigKeys.CHECKOUT_REQUIRE_PHONE),
    };
  };

  return {
    queryOptions: {
      queryKey: service.queryKey,
      queryFn: getAll,
      staleTime: useTime().DAY,
    },
    subscribe,
    isReady,
    meta,
    getOne,
    getAll,
    refresh,
    filter: filterUnifiedAddresses,
    findOne,
    getDefault,
    getCached,
    remove,
    setDefault,
    invalidate: async () => {
      // Invalidate the unified-addresses query
      await invalidateQueryByKey(service.queryKey)(null);

      // Also invalidate the underlying queries
      const { invalidate: invalidateAddresses } = useClientAddresses();
      const { invalidate: invalidateCompanies } = useClientCompanies();

      await Promise.all([invalidateAddresses(null), invalidateCompanies(null)]);
    },
  };
};
