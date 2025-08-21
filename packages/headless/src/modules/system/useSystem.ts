// --- external
import { ref, computed, toRaw } from "vue";

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
  isString
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

// Query types
type StatusesQuery = ReturnType<typeof services.fetchStatuses>;
type LanguagesQuery = ReturnType<typeof services.fetchLanguages>;
type DepartmentsQuery = ReturnType<typeof services.fetchDepartments>;

const { addError } = useFeedback();

/**
 * The `useSystem` composable provides a simple interface to interact with the system API
 * and includes utility methods for fetching data.
 */
export const useSystem = () => {
  const { isReady: brandIsReady, countryId, currencyId } = useBrand();

  // --- queries (auto-loading essential data)
  const countriesQuery = services.fetchCountries();
  const currenciesQuery = services.fetchCurrencies();
  const billingCyclesQuery = services.fetchBillingCycles();

  // --- lazy-loaded queries
  const statusesQuery = ref<StatusesQuery>();
  const languagesQuery = ref<LanguagesQuery>();
  const departmentsQuery = ref<DepartmentsQuery>();

  // --- meta information
  const meta = computed(() => {
    const essentialQueries = reject(
      [countriesQuery, currenciesQuery, billingCyclesQuery],
      isEmpty
    );
    const optionalQueries = reject(
      [statusesQuery.value, languagesQuery.value, departmentsQuery.value],
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
    try {
      await brandIsReady();

      return new Promise(resolve => {
        const interval = setInterval(() => {
          if (meta.value.isComplete) {
            clearInterval(interval);
            resolve(!meta.value.hasError);
          }
        }, 100);
      });
    } catch {
      return false;
    }
  }

  // --- computed data accessors
  const statuses = computed(() => statusesQuery.value?.data || []);
  const countries = computed(() => countriesQuery?.data.value || []);
  const languages = computed(() => languagesQuery.value?.data || []);
  const currencies = computed(() => currenciesQuery?.data.value || []);
  const departments = computed(() => departmentsQuery.value?.data || []);
  const billingCycles = computed(() => billingCyclesQuery?.data.value || []);

  const errors = computed(() => ({
    countries: countriesQuery?.error.value,
    currencies: currenciesQuery?.error.value,
    billingCycles: billingCyclesQuery?.error.value,
    statuses: statusesQuery.value?.error,
    languages: languagesQuery.value?.error,
    departments: departmentsQuery.value?.error
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
      return stores.regions.state[countryCode];
    }

    const query = services.fetchRegions({
      data: { id: country.id, code: country.code }
    });
    return query!.promise.value;
  }

  async function fetchStatuses(): Promise<IStatus[]> {
    if (!statusesQuery.value) {
      statusesQuery.value = services.fetchStatuses();
    }

    const query = statusesQuery.value;
    if (!query?.isFetched) {
      await query?.refetch();
    }

    return statuses.value as IStatus[];
  }

  async function fetchCountries(): Promise<ICountry[]> {
    if (countriesQuery && !countriesQuery.isFetched)
      await countriesQuery.refetch();

    return countries.value;
  }

  async function fetchLanguages(): Promise<ILanguage[]> {
    try {
      if (!languagesQuery.value) {
        languagesQuery.value = services.fetchLanguages();
      }

      const query = languagesQuery.value;
      if (!query?.isFetched) {
        await query?.refetch();
      }

      return languages.value as ILanguage[];
    } catch (e) {
      const error = mapToHeadlessError(e);
      addError(error?.message || "Failed to fetch languages");
      return [];
    }
  }

  async function fetchDepartments(): Promise<ITicketDepartment[]> {
    if (!departmentsQuery.value) {
      departmentsQuery.value = services.fetchDepartments();
    }

    const query = departmentsQuery.value;
    if (!query?.isFetched) {
      await query?.refetch();
    }

    return departments.value as ITicketDepartment[];
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
    refresh: () => {
      countriesQuery?.refetch();
      currenciesQuery?.refetch();
      billingCyclesQuery?.refetch();
      statusesQuery.value?.refetch();
      languagesQuery.value?.refetch();
      departmentsQuery.value?.refetch();
    },

    invalidate: () => {
      invalidateQueryByKey(["system"], { exact: false });
    }
  };
};

/**
 * The return type of useSystem composable.
 */
export type UseSystem = ReturnType<typeof useSystem>;
