import { computed } from "vue";
import { useBrand } from "../brand";
import { invalidateQueryByKey } from "../query";
import services, { stores } from "./system.services";
import {
  every,
  find,
  forEach,
  get,
  includes,
  isArray,
  isEmpty,
  isString,
  keys,
  some
} from "lodash-es";
import type {
  IBillingCycle,
  ICountry,
  IRegion
} from "@upmind-automation/types";

// -----------------------------------------------------------------------------
/**
 * Context to let us understand if we need to refetch on the initial use of Brand settings
 * We do this because settings are persisted for fast load times, but we still need
 * to ensure that we get the latest settings in the background
 * NB:check if we actually have any persisted settings first
 *
 */
let needsRefresh = some(keys(localStorage), key => includes(key, `"system"`));

// --- singleton queries to prevent multiple fetches

let countriesQuery: ReturnType<typeof services.fetchCountries>;
let billingCyclesQuery: ReturnType<typeof services.fetchBillingCycles>;
// let statusesQuery: ReturnType<typeof services.fetchStatuses>;
// let departmentsQuery: ReturnType<typeof services.fetchDepartments>;
// -----------------------------------------------------------------------------

/**
 * The `useSystem` composable provides a simple interface to interact with the system API
 * and includes utility methods for fetching data.
 */
export const useSystem = () => {
  // --- queries are lazy-loaded via ensure* methods (no eager fetching)

  // --- state
  const activeQueries = computed(() =>
    [countriesQuery, billingCyclesQuery].filter(Boolean)
  );

  // --- meta information
  const meta = computed(() => {
    const queries = activeQueries.value;
    const hasError = some(queries, "isError.value");
    const isLoading = some(queries, "isLoading.value");
    const isComplete = isEmpty(queries)
      ? true
      : every(queries, "isFetched.value");

    return {
      isEmpty: queries.some(q => isEmpty(q?.data?.value)),
      hasError,
      isLoading,
      isComplete,
      isAvailable: true,
      isReady: isComplete && !hasError
    };
  });

  // --- readiness check
  async function isReady(): Promise<boolean> {
    // If no queries have been requested yet, resolve immediately
    if (isEmpty(activeQueries.value)) return true;

    return new Promise(resolve => {
      const interval = setInterval(() => {
        if (meta.value.isComplete) {
          clearInterval(interval);
          resolve(!meta.value.hasError);
        }
      }, 100);
    });
  }

  // --- computed
  const countries = computed(() => countriesQuery?.data.value || []);
  const billingCycles = computed(() => billingCyclesQuery?.data.value || []);

  const errors = computed(() => ({
    countries: countriesQuery?.error.value,
    billingCycles: billingCyclesQuery?.error.value
  }));

  // --- helper methods

  function getRegion(
    values: string | string[],
    country: string | ICountry
  ): IRegion | undefined {
    const regions = getRegions(country);
    if (isEmpty(regions)) return undefined;

    if (isArray(values)) {
      return find(regions, region =>
        some(
          values,
          value =>
            value?.toLowerCase() === get(region, "name", "")?.toLowerCase()
        )
      );
    }

    return find(regions, ["name", values]);
  }

  function getRegions(country: string | ICountry): IRegion[] | undefined {
    const countryCode = isString(country) ? country : country.code;
    return get(stores.regions.state, countryCode);
  }

  function getCountry(value?: string | null): ICountry {
    const { countryId } = useBrand();

    // if we are not passed a country, then we need to get the default country
    value ??= countryId.value;

    if (value?.length == 2)
      return (find(countries.value, ["code", value]) ??
        find(countries.value, ["id", countryId.value])) as ICountry;

    return (find(countries.value, ["id", value]) ??
      find(countries.value, ["id", countryId.value])) as ICountry;
  }

  function getBillingCycle(value: number): IBillingCycle | undefined {
    return find(billingCycles.value, ["months", value]);
  }

  // --- fetch methods
  async function fetchRegions(country?: ICountry | string): Promise<IRegion[]> {
    const { countryId } = useBrand();

    // if we are not passed a country, then we need to get the default country
    country ??= countryId.value;

    //  ensure we have a country object to fetch regions
    if (isString(country)) country = getCountry(country);

    if (!country) return [];

    const countryCode = country.code;
    // Serve settled data from the store; an in-flight fetch must be awaited
    // via its query promise (TanStack dedupes by queryKey) — a concurrent
    // caller reading the store mid-flight gets [] and downstream rejects.
    if (!isEmpty(stores.regions.state[countryCode])) {
      return stores.regions.state[countryCode];
    }

    const query = services.fetchRegions({
      data: { id: country.id, code: country.code }
    });

    return await query!.promise.value;
  }

  // Wait for brand (and therefore locale) to be ready before firing reference
  // queries. Without this, the first caller fires under the default locale
  // (e.g. "en") and a second caller post-locale-resolution refires under the
  // brand locale (e.g. "en-GB") because TanStack keys reference data per locale.
  async function ensureBrandReady(): Promise<void> {
    const { isReady: brandReady } = useBrand();
    await brandReady();
  }

  async function ensureCountries(): Promise<ICountry[]> {
    await ensureBrandReady();
    countriesQuery ??= services.fetchCountries();
    if (!countriesQuery?.isFetched?.value) await countriesQuery?.promise.value;
    return countries.value;
  }

  async function ensureBillingCycles(): Promise<IBillingCycle[]> {
    await ensureBrandReady();
    billingCyclesQuery ??= services.fetchBillingCycles();
    if (!billingCyclesQuery?.isFetched?.value)
      await billingCyclesQuery?.promise.value;
    return billingCycles.value;
  }

  async function fetchCountries(): Promise<ICountry[]> {
    return ensureCountries();
  }

  // --- Utility methods for cache management and re-fetching
  const refresh = async () => {
    // Only refetch queries that have been activated
    forEach(activeQueries.value, q => q?.refetch());
  };

  const invalidate = () => {
    // A broader invalidating for anything under the "brand" query key namespace
    invalidateQueryByKey(["system"], { exact: false });
  };

  // --- side effects

  // after the first load, ensure we refetch our data in the background if we have previously fetched/persisted
  // Only trigger if queries have been activated
  if (needsRefresh && !isEmpty(activeQueries.value)) {
    isReady().then(() => {
      if (needsRefresh) {
        refresh();
        needsRefresh = false;
      }
    });
  }

  // ---------------------------------------------------------------------------

  return {
    // --- state
    /**
     * Resolves when the brand service is ready or errors.
     */
    isReady,

    /**
     * Meta-information about the system state.
     * @type {Object} SystemMeta
     * @property {boolean} isEmpty - Indicates if the system data is empty.
     * @property {boolean} isReady - Indicates if the system state is ready for use.
     * @property {boolean} hasError - Indicates if there are any errors in the system state.
     * @property {boolean} isLoading - Indicates if the system state is currently loading.
     * @property {boolean} isComplete - Indicates if the system state has completed loading.
     * @property {boolean} isAvailable - Indicates if the system state is available.
     */
    meta,

    /**
     * Computed property to any errors encountered during the system state machine's process.
     */
    errors,

    // --- context

    /**
     * Computed property to the system's countries.
     */
    countries,

    /**
     * Computed property to the system's billing cycles.
     */
    billingCycles,

    // --- get methods
    /**
     * Returns a specific region object by name or array of names for a given country.
     * @param values - The region name or array of region names.
     * @param country - The country object or code.
     * @returns The matching region object, or undefined if not found.
     */
    getRegion,

    /**
     * Returns the country object for a given country code or id.
     * @param value - The country code (2-letter) or id.
     * @returns The matching country object, or the default country if not found.
     */
    getCountry,
    /**
     * Returns the regions for a given country from the context.
     * @param value - The country object or code.
     * @returns The regions array for the country, or undefined if not found.
     */
    getRegions,

    /**
     * Returns the billing cycle object for a given number of months.
     * @param value - The number of months for the billing cycle.
     * @returns The matching billing cycle object, or undefined if not found.
     */
    getBillingCycle,
    // --- fetch methods
    /**
     * Ensures billing cycles are loaded, fetching if not already cached.
     * @returns A promise resolving to the list of billing cycles.
     */
    ensureBillingCycles,

    /**
     * Ensures countries are loaded, fetching if not already cached.
     * @returns A promise resolving to the list of countries.
     */
    ensureCountries,

    /**
     * Fetches the list of countries from the API or returns cached countries if available.
     * @deprecated Use ensureCountries() instead.
     * @returns A promise resolving to the list of countries.
     */
    fetchCountries,

    /**
     * Fetches the regions for a given country from the API or returns cached regions if available.
     * @param country - The country object or code to fetch regions for.
     * @returns A promise resolving to the list of regions for the country.
     */
    fetchRegions,

    // --- utility methods
    /**
     * Refreshes all system-related queries to fetch the latest data from the API.
     */
    refresh,

    /**
     * Invalidates all system-related queries in the cache, forcing them to refetch on next access.
     */
    invalidate
  };
};

/** The return type of {@link useSystem} composable. */
export type UseSystem = ReturnType<typeof useSystem>;
