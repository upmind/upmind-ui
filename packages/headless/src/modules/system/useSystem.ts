// --- external
import { computed } from "vue";

// --- internal
import services, { stores } from "./services";
import { useBrand } from "../brand";
import { invalidateQueryByKey } from "../query";

// --- utils
import {
  get,
  has,
  find,
  some,
  every,
  reject,
  isEmpty,
  isArray,
  isString,
  keys,
  includes,
  forEach
} from "lodash-es";

// --- types
import type {
  IStatus,
  IRegion,
  ICountry,
  ILanguage,
  ICurrency,
  IBillingCycle,
  ITicketDepartment
} from "@upmind-automation/types";
import { useFeedback } from "../feedback";
import { mapToHeadlessError } from "../../utils";

const { addError } = useFeedback();

// -----------------------------------------------------------------------------
/**
 * Context to let us understand if we need to refetch on the inital use of Brand settings
 * We do this because settings are persisted for fast load times but we still need
 * to ensure that we get the latest settings in the background
 * NB:check if we actually have any persisted settings first
 *
 */
let needsRefresh = some(keys(localStorage), key => includes(key, `"system"`));

// --- singleton queries to prevent multiple fetches

let countriesQuery: ReturnType<typeof services.fetchCountries>;
let currenciesQuery: ReturnType<typeof services.fetchCurrencies>;
let billingCyclesQuery: ReturnType<typeof services.fetchBillingCycles>;
let statusesQuery: ReturnType<typeof services.fetchStatuses>;
let languagesQuery: ReturnType<typeof services.fetchLanguages>;
let departmentsQuery: ReturnType<typeof services.fetchDepartments>;
// -----------------------------------------------------------------------------

/**
 * The `useSystem` composable provides a simple interface to interact with the system API
 * and includes utility methods for fetching data.
 */
export const useSystem = () => {
  const { isReady: brandIsReady, countryId, currencyId } = useBrand();

  // --- queries (auto-loading essential data)
  countriesQuery ??= services.fetchCountries();
  currenciesQuery ??= services.fetchCurrencies();
  billingCyclesQuery ??= services.fetchBillingCycles();

  // --- state

  const queries = [
    billingCyclesQuery,
    countriesQuery,
    currenciesQuery,
    departmentsQuery,
    languagesQuery,
    statusesQuery
  ];

  // --- meta information
  const meta = computed(() => {
    const essentialQueries = reject(
      [countriesQuery, currenciesQuery, billingCyclesQuery],
      isEmpty
    );
    const optionalQueries = reject(
      [statusesQuery, languagesQuery, departmentsQuery],
      isEmpty
    );

    const allQueries = [...essentialQueries, ...optionalQueries];

    const hasError = computed(() => some(allQueries, "isError"));
    const isLoading = computed(() => some(allQueries, "isLoading"));
    const isComplete = computed(() => every(allQueries, "isComplete"));

    return {
      isEmpty: allQueries.some(q => isEmpty(q?.data?.value)),
      hasError,
      isLoading,
      isComplete,
      isAvailable: true,
      isReady: isComplete && !hasError
    };
  });

  // --- readiness check
  async function isReady(): Promise<boolean> {
    return brandIsReady().then(() => {
      return new Promise(resolve => {
        const interval = setInterval(() => {
          if (meta.value.isComplete) {
            clearInterval(interval);
            resolve(!meta.value.hasError);
          }
        }, 100);
      });
    });
  }

  // --- computed
  const statuses = computed(() => statusesQuery?.data.value || []);
  const countries = computed(() => countriesQuery?.data.value || []);
  const languages = computed(() => languagesQuery?.data.value || []);
  const currencies = computed(() => currenciesQuery?.data.value || []);
  const departments = computed(() => departmentsQuery?.data.value || []);
  const billingCycles = computed(() => billingCyclesQuery?.data.value || []);

  const errors = computed(() => ({
    countries: countriesQuery?.error.value,
    currencies: currenciesQuery?.error.value,
    billingCycles: billingCyclesQuery?.error.value,
    statuses: statusesQuery?.error.value,
    languages: languagesQuery?.error.value,
    departments: departmentsQuery?.error.value
  }));

  // --- helper methods
  function getStatus(value: string): IStatus | undefined {
    return find(statuses.value, ["code", value]);
  }

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
    // if we are not passed a country, then we need to get the default country
    value ??= countryId.value;

    if (value?.length == 2)
      return (find(countries.value, ["code", value]) ??
        find(countries.value, ["id", countryId.value])) as ICountry;

    return (find(countries.value, ["id", value]) ??
      find(countries.value, ["id", countryId.value])) as ICountry;
  }

  function getCurrency(value?: string): ICurrency | undefined {
    value ??= currencyId.value;

    if (value?.length === 3) {
      return (
        find(currencies.value, ["code", value]) ??
        find(currencies.value, ["id", currencyId.value])
      );
    }

    return (
      find(currencies.value, ["id", value]) ??
      find(currencies.value, ["id", currencyId.value])
    );
  }

  function getLanguage(value: string): ILanguage | undefined {
    return find(languages.value, ["code", value]);
  }

  function getDepartment(value: string): ITicketDepartment | undefined {
    return find(departments.value, ["code", value]);
  }

  function getBillingCycle(value: number): IBillingCycle | undefined {
    return find(billingCycles.value, ["months", value]);
  }

  // --- fetch methods
  async function fetchRegions(country?: ICountry | string): Promise<IRegion[]> {
    // if we are not passed a country, then we need to get the default country
    country ??= countryId.value;

    //  ensure we have a country object to fetch regions
    if (isString(country)) country = getCountry(country);

    if (!country) return [];

    const countryCode = country.code;
    // Check if we already have a query for this country
    if (has(stores.regions.state, countryCode)) {
      const regions = stores.regions.state[countryCode];
      return regions;
    }

    const query = services.fetchRegions({
      data: { id: country.id, code: country.code }
    });

    const regions = await query!.promise.value;
    return regions;
  }

  async function fetchStatuses(): Promise<IStatus[]> {
    statusesQuery ??= services.fetchStatuses();

    if (!statusesQuery?.isFetched) {
      await statusesQuery?.refetch();
    }

    return statuses.value;
  }

  async function fetchCountries(): Promise<ICountry[]> {
    if (!countriesQuery?.isFetched) await countriesQuery?.refetch();
    return countries.value;
  }

  async function fetchLanguages(): Promise<ILanguage[]> {
    languagesQuery ??= services.fetchLanguages();

    if (!languagesQuery?.isFetched) await languagesQuery?.refetch();
    return languages.value as ILanguage[];
  }

  async function fetchDepartments(): Promise<ITicketDepartment[]> {
    departmentsQuery ??= services.fetchDepartments();

    if (!departmentsQuery?.isFetched) await departmentsQuery?.refetch();

    return departments.value as ITicketDepartment[];
  }

  // --- Utility methods for cache management and re-fetching
  const refresh = async () => {
    // Invalidate all related queries that feed into state via services.ts
    forEach(queries, q => q?.refetch());
  };

  const invalidate = () => {
    // A broader invalidating for anything under the "brand" query key namespace
    invalidateQueryByKey(["system"], { exact: false });
  };

  // --- side effects

  // after first load, ensure we refetch our data in the background if we have previously fetched/persisted
  isReady().then(() => {
    if (needsRefresh) {
      refresh();
      needsRefresh = false;
    }
  });

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
     * Computed property to the system's statuses.
     */
    statuses,
    /**
     * Computed property to the system's languages.
     */
    languages,
    /**
     * Computed property to the system's countries.
     */
    countries,
    /**
     * Computed property to the system's currencies.
     */
    currencies,
    /**
     * Computed property to the system's departments.
     */
    departments,
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
     * Returns the status object for a given status code.
     * @param value - The status code.
     * @returns The matching status object, or undefined if not found.
     */
    getStatus,
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
     * Returns the currency object for a given currency code or id.
     * @param value - The currency code (3-letter) or id.
     * @returns The matching currency object, or undefined if not found.
     */
    getCurrency,
    /**
     * Returns the language object for a given language code.
     * @param value - The language code.
     * @returns The matching language object, or undefined if not found.
     */
    getLanguage,
    /**
     * Returns the department object for a given department code.
     * @param value - The department code.
     * @returns The matching department object, or undefined if not found.
     */
    getDepartment,
    /**
     * Returns the billing cycle object for a given number of months.
     * @param value - The number of months for the billing cycle.
     * @returns The matching billing cycle object, or undefined if not found.
     */
    getBillingCycle,
    // --- fetch methods
    /**
     * Fetches the regions for a given country from the API or returns cached regions if available.
     * @param country - The country object or code to fetch regions for.
     * @returns A promise resolving to the list of regions for the country.
     */
    fetchRegions,
    /**
     * Fetches the list of statuses from the API or returns cached statuses if available.
     * @returns A promise resolving to the list of statuses.
     */
    fetchStatuses,
    /**
     * Fetches the list of countries from the API or returns cached countries if available.
     * @returns A promise resolving to the list of countries.
     */
    fetchCountries,
    /**
     * Fetches the list of languages from the API or returns cached languages if available.
     * @returns A promise resolving to the list of languages.
     */
    fetchLanguages,
    /**
     * Fetches the list of departments from the API or returns cached departments if available.
     * @returns A promise resolving to the list of departments.
     */
    fetchDepartments,

    // --- utility methods
    refresh,

    invalidate
  };
};

/**
 * The return type of useSystem composable.
 */
export type UseSystem = ReturnType<typeof useSystem>;
