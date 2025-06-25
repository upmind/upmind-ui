// --- external

import { computed } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";
import { interpret, InterpreterStatus, State } from "xstate";

// --- internal

import systemMachine from "./system.machine";
import { useBrand } from "../brand";

// --- utils

import {
  DetailedError,
  ErrorOrigin,
  responseCodes,
  ResponseError,
  stateMatches,
  useContext,
} from "../../utils";
import { find, isString, get, isEmpty, some, isArray, omit } from "lodash-es";

// --- types
import {
  IBillingCycle,
  ILanguage,
  IStatus,
  ITicketDepartment,
  type ICountry,
  type ICurrency,
  type IRegion,
} from "@upmind-automation/types";
import { SystemContext } from "./types";

// -----------------------------------------------------------------------------
// create a global instance of the brand machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

const service = interpret(systemMachine, { devTools: false });

// -----------------------------------------------------------------------------

/**
 * The `useSystem` composable provides a simple interface to interact with the system API
 * through a state machine and includes utility methods for fetching data.
 *
 * @returns An object containing the system state, context, errors, responses, meta, and fetch utilities.
 */
export const useSystem = () => {
  const { isReady: brandIsReady, countryId, currencyId } = useBrand();

  // --- state
  if (service.status == InterpreterStatus.NotStarted) service.start();

  const { state, send } = useActor(service);

  const isReady = () =>
    brandIsReady().then(
      () =>
        ["currencies.complete", "billingCycles.complete"].every(
          state.value.matches
        ) &&
        [
          "countries.idle",
          "regions.idle",
          "languages.idle",
          "statuses.idle",
          "departments.idle",
          "countries.complete",
          "regions.complete",
          "languages.complete",
          "statuses.complete",
          "departments.complete",
        ].some(state.value.matches)
    );

  const meta = computed(() => ({
    hasErrors: stateMatches(state, [
      "organisation.error",
      "config.error",
      "settings.error",
      "modules.error",
      "currencies.error",
      "countries.error",
      "regions.error",
      "languages.error",
      "statuses.error",
      "departments.error",
    ]),
    isComplete: [
      "currencies.complete",
      "billingCycles.complete",
      "countries.complete",
      "regions.complete",
      "languages.complete",
      "statuses.complete",
      "departments.complete",
    ].every(state.value.matches),
    isLoading: stateMatches(state, [
      "currencies.loading",
      "billingCycles.loading",
      "countries.loading",
      "regions.loading",
      "languages.loading",
      "statuses.loading",
      "departments.loading",
    ]),
    isReady: isReady(),
  }));

  // --- context

  const context = useContext<SystemContext>(state);
  const errors = useContext<ResponseError>(state, "error");
  const billingCycles = useContext<IBillingCycle[]>(
    state,
    "billingCycles",
    undefined
  );
  const currencies = useContext<ICurrency[]>(state, "currencies", undefined);
  const countries = useContext<ICountry[]>(state, "countries", undefined);
  const regions = useContext<IRegion[]>(state, "regions", {});
  const languages = useContext<ILanguage[]>(state, "languages", undefined);
  const statuses = useContext<IStatus[]>(state, "statuses", undefined);
  const departments = useContext<ITicketDepartment[]>(
    state,
    "departments",
    undefined
  );

  // --- helpers

  /**
   * Get specific system-related data from Upmind's API.
   * @param key The key representing the type of data to fetch (e.g., countries, regions, languages).
   * @param value Optional additional data for the fetch operation.
   * @returns {Promise<any>} A promise that resolves to the fetched data.
   */
  const fetch = async (
    node: string,
    getValues: (data: any) => any,
    data?: any
  ): Promise<any> => {
    const values = getValues(data);
    if (values) return Promise.resolve(values);

    if (state.value.matches(`${node}.loading`)) {
      await waitFor(
        service,
        newstate =>
          [`${node}.processed`, `${node}.complete`].some(newstate.matches),
        { timeout: Infinity }
      ).catch(() => {
        throw new DetailedError(
          `[headless] fetch on useSystem timed out while fetching "${node}"`,
          responseCodes.Timeout,
          ErrorOrigin.Headless
        );
      });
      return fetch(node, getValues, data);
    }
    service.send({
      type: `${node.toUpperCase()}.GET`,
      data,
    });
    return new Promise((resolve, reject) => {
      waitFor(
        service,
        state => [`${node}.processed`, `${node}.error`].some(state.matches),
        { timeout: Infinity }
      )
        .then(state => {
          if (state.matches(`${node}.processed`)) {
            resolve(getValues(data));
          } else {
            reject(get(errors.value, node));
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  };

  // --- methods

  function getCurrency(value?: string): ICurrency {
    // if we are not passed a country, then we need to get the default country
    value ??= currencyId.value;

    if (value?.length == 3)
      return (find(currencies.value, ["code", value]) ??
        find(currencies.value, ["id", currencyId.value])) as ICurrency;

    return (find(currencies.value, ["id", value]) ??
      find(currencies.value, ["id", currencyId.value])) as ICurrency;
  }

  function getBillingCycle(value: number) {
    return find(billingCycles.value, ["months", value]);
  }

  function getCountry(value?: string): ICountry {
    // if we are not passed a country, then we need to get the default country
    value ??= countryId.value;

    if (value?.length == 2)
      return (find(countries.value, ["code", value]) ??
        find(countries.value, ["id", countryId.value])) as ICountry;

    return (find(countries.value, ["id", value]) ??
      find(countries.value, ["id", countryId.value])) as ICountry;
  }

  async function fetchRegions(country?: ICountry | string): Promise<IRegion[]> {
    // if we are not passed a country, then we need to get the default country
    country ??= countryId.value;

    //  ensure we have a country object in order to fetch regions
    if (isString(country)) country = getCountry(country);

    if (!country) return Promise.resolve([]);

    return fetch("regions", getRegions, country);
  }

  function getRegions(value: string | ICountry): IRegion[] | undefined {
    return get(regions.value, isString(value) ? value : value.code) as
      | IRegion[]
      | undefined;
  }

  function getRegion(values: string | string[], country: string | ICountry) {
    let found;

    const regions = getRegions(country);

    if (isEmpty(regions)) return found;

    if (isArray(values)) {
      return find(regions, region =>
        some(
          values,
          value =>
            value?.toLowerCase() == get(region, "name", "")?.toLowerCase()
        )
      );
    }

    return find(regions, ["name", values]);
  }

  function getLanguage(value: string) {
    return find(languages.value, ["code", value]);
  }

  function getStatus(value: string) {
    return find(statuses.value, ["code", value]);
  }

  function getDepartment(value: string) {
    return find(departments.value, ["code", value]);
  }

  // ---------------------------------------------------------------------------

  return {
    // --- state
    /**
     * The current XState brand machine state.
     */
    state,

    /**
     * Resolves when the brand service is ready or errors.
     */
    isReady,

    /**
     * Meta information about the system state.
     * @typedef {Object} SystemMeta
     * @property {boolean} hasErrors - Indicates if there are any errors in the system process.
     * @property {boolean} isComplete - Indicates if the system process is complete.
     * @property {boolean} isLoading - Indicates if the system is currently loading.
     * @property {boolean} isReady - Indicates if the system is ready for use.
     */
    meta,

    // --- context
    /**
     * Computed property to the system's state machine context, containing fetched data.
     */
    context,
    /**
     * Computed property to any errors encountered during the system state machine's process.
     */
    errors,

    // --- context
    /**
     * Computed property to the system's billing cycles.
     */
    billingCycles,
    /**
     * Computed property to the system's currencies.
     */
    currencies,
    /**
     * Computed property to the system's countries.
     */
    countries,
    /**
     * Computed property to the system's languages.
     */
    languages,
    /**
     * Computed property to the system's statuses.
     */
    statuses,
    /**
     * Computed property to the system's departments.
     */
    departments,

    // --- methods

    /**
     * Returns the currency object for a given currency code or id.
     * @param value - The currency code (3-letter) or id.
     * @returns The matching currency object, or undefined if not found.
     */
    getCurrency,

    /**
     * Returns the billing cycle object for a given number of months.
     * @param value - The number of months for the billing cycle.
     * @returns The matching billing cycle object, or undefined if not found.
     */
    getBillingCycle,

    /**
     * Fetches the list of countries from the API or returns cached countries if available.
     * @returns A promise resolving to the list of countries.
     */
    fetchCountries: async () =>
      fetch("countries", () => {
        return countries.value;
      }),

    /**
     * Returns the country object for a given country code or id.
     * @param value - The country code (2-letter) or id.
     * @returns The matching country object, or the default country if not found.
     */
    getCountry,

    /**
     * Fetches the regions for a given country from the API or returns cached regions if available.
     * @param country - The country object or code to fetch regions for.
     * @returns A promise resolving to the list of regions for the country.
     */
    fetchRegions,

    /**
     * Returns the regions for a given country from the context.
     * @param value - The country object or code.
     * @returns The regions array for the country, or undefined if not found.
     */
    getRegions,

    /**
     * Returns a specific region object by name or array of names for a given country.
     * @param values - The region name or array of region names.
     * @param country - The country object or code.
     * @returns The matching region object, or undefined if not found.
     */
    getRegion,

    /**
     * Fetches the list of languages from the API or returns cached languages if available.
     * @returns A promise resolving to the list of languages.
     */
    fetchLanguages: async () => fetch("languages", () => languages.value),

    /**
     * Returns the language object for a given language code.
     * @param value - The language code.
     * @returns The matching language object, or undefined if not found.
     */
    getLanguage,

    /**
     * Fetches the list of statuses from the API or returns cached statuses if available.
     * @returns A promise resolving to the list of statuses.
     */
    fetchStatuses: async () => fetch("statuses", () => statuses.value),

    /**
     * Returns the status object for a given status code.
     * @param value - The status code.
     * @returns The matching status object, or undefined if not found.
     */
    getStatus,

    /**
     * Fetches the list of departments from the API or returns cached departments if available.
     * @returns A promise resolving to the list of departments.
     */
    fetchDepartments: async () => fetch("departments", () => departments.value),

    /**
     * Returns the department object for a given department code.
     * @param value - The department code.
     * @returns The matching department object, or undefined if not found.
     */
    getDepartment,
  };
};

/**
 * The return type of useSystem composable.
 */
export type UseSystem = ReturnType<typeof useSystem>;
