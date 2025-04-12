// --- internal
import {
  QueryObserver,
  invalidateQueryByKey,
  useQuerySubscription,
} from "../../query";
import service from "./unifiedAddress/services";
import { useTime } from "../../../utils";
import { useSession } from "../../session";
import { useFeedback } from "../../feedback";

// --- utils
import {
  find,
  filter,
  includes,
  isString,
  every,
  get,
  map,
  has,
  isNil,
} from "lodash-es";

// --- types
import type { UnifiedAddress } from "./unifiedAddress";
import type { QueryCacheNotifyEvent } from "@tanstack/query-core";
import {
  useClientAddresses,
  useClientCompanies,
  useClientEmails,
} from "../../client";

let observer: QueryObserver | undefined;

/**
 * Subscribe to the client address query that are present in the cache.
 * This will trigger the callback function when the query is ready/updated.
 * @param callback The callback function to be called when the query is ready/updated.
 * @returns The unsubscribe function
 */
const subscribe = (
  callback: (query: QueryCacheNotifyEvent["query"]) => void
): QueryObserver => {
  if (!observer) {
    observer = useQuerySubscription(service.queryKey, callback);
  }
  return observer;
};

export const useBillingDetails = () => {
  const { addError, addSuccess } = useFeedback();
  const { isAuthenticated } = useSession();

  /**
   * Check if the unified addresses are loaded and ready
   * @returns A promise that resolves to true when the unified addresses are ready to be fetched.
   * @example isReady().then(getAll).then(() => console.log("Details are ready))
   */
  async function isReady(): Promise<void> {
    return isAuthenticated();
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

    // Fetch addresses and companies in parallel
    const [addresses, companies] = await Promise.all([
      getAddresses({ allowStale }),
      getCompanies({ allowStale }),
    ]);

    // Create unified addresses from regular addresses
    const unifiedAddresses = map(addresses || [], address => ({
      ...address,
      companyDetails: false,
    }));

    // Create unified addresses from companies
    const companyAddresses = map(companies || [], company => {
      const address = find(addresses || [], ["id", company.addressId]);

      return {
        ...address,
        companyDetails: true,
        companyId: company.id,
        companyName: company.name,
        regNumber: company.regNumber,
        vatNumber: company.vatNumber,
      };
    });

    // Combine and return all unified addresses
    return [...unifiedAddresses, ...companyAddresses] as UnifiedAddress[];
  }

  /**
   * Get all the unified addresses from the cache.
   * @returns An array of parsed unified addresses if found, otherwise an empty array.
   * @example getAllFromCache().then((addresses) => console.log(addresses))
   * @throws {@link CacheIsStaleError} when the cache is stale
   */
  function getAllFromCache() {
    const { getAllFromCache: getAddresses } = useClientAddresses();
    const { getAllFromCache: getCompanies } = useClientCompanies();

    // Fetch addresses and companies in parallel
    const addresses = getAddresses();
    const companies = getCompanies();

    // Create unified addresses from regular addresses
    const unifiedAddresses = map(addresses || [], address => ({
      ...address,
      companyDetails: false,
    }));

    // Create unified addresses from companies
    const companyAddresses = map(companies || [], company => {
      const address = find(addresses || [], ["id", company.addressId]);

      return {
        ...address,
        companyDetails: true,
        companyId: company.id,
        companyName: company.name,
        regNumber: company.regNumber,
        vatNumber: company.vatNumber,
      };
    });

    // Combine and return all unified addresses
    return [...unifiedAddresses, ...companyAddresses] as UnifiedAddress[];
  }

  /**
   * Get a single unified address by id.
   * @param id The id of the unified address to get.
   * @returns The unified address object if found, otherwise undefined.
   * @example getOne("123").then((address) => console.log(address))
   */
  function getOne(id: string) {
    const unifiedAddresses = getAllFromCache();
    return find(unifiedAddresses, ["id", id]);
  }

  /**
   * Find a single unified address based on the given param. The param is matched against the title and description.
   * @param mapping The filter to match against the unified address title and description.
   * @returns The unified address object if found, otherwise undefined.
   * @example findOne("home").then((address) => console.log(address))
   */
  function findOne(mapping: string | Partial<UnifiedAddress>) {
    const unifiedAddresses = getAllFromCache();
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
    const addresses = getAllFromCache();
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

    // Check if the address is a company address
    if (has(unifiedAddress, "companyDetails")) {
      // Remove company address
      return removeCompany(id)
        .then(() => addSuccess("Successfully removed company address"))
        .catch(error => {
          addError({
            message: {
              title: "Something went wrong.",
              copy: isString(error)
                ? error
                : "We experienced an error removing this company address",
            },
          });
        });
    }

    return removeAddress(id)
      .then(() => addSuccess("Successfully removed address"))
      .catch(error => {
        addError({
          message: {
            title: "Something went wrong.",
            copy: isString(error)
              ? error
              : "We experienced an error removing this address",
          },
        });
      });
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

    // Check if the address is a company address
    if (has(unifiedAddress, "companyDetails")) {
      // Remove company address
      return setCompanyAsDefault(id)
        .then(() => addSuccess("Successfully removed company address"))
        .catch(error => {
          addError({
            message: {
              title: "Something went wrong.",
              copy: isString(error)
                ? error
                : "We experienced an error removing this company address",
            },
          });
        });
    }

    return setAddressAsDefault(id)
      .then(() => addSuccess("Successfully set address as default"))
      .catch(error => {
        addError({
          message: {
            title: "Something went wrong.",
            copy: isString(error)
              ? error
              : "We experienced an error setting this address as default",
          },
        });
      });
  }

  return {
    queryOptions: {
      queryKey: service.queryKey,
      queryFn: () => getAll(),
      staleTime: useTime().DAY,
    },
    subscribe,
    isReady,
    getOne,
    getAll,
    filter: filterUnifiedAddresses,
    findOne,
    getDefault,
    getAllFromCache,
    remove,
    setDefault,
    invalidate: invalidateQueryByKey(service.queryKey),
  };
};
