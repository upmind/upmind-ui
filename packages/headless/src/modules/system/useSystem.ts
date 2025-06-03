// --- external

import { computed } from "vue";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";
import { interpret } from "xstate";

// --- internal

import systemMachine from "./system.machine";
import { useBrand } from "../brand";

// --- utils

import { DetailedError, responseCodes } from "../../utils";
import { find, isString, get, isEmpty, some, isArray, omit } from "lodash-es";

// --- types
import type { ICountry } from "@upmind-automation/types";

// ---------------------------------------------------------------------------

/**
 * The `useSystem` composable provides a simple interface to interact with the system API
 * through a state machine and includes utility methods for fetching data.
 *
 * @returns An object containing the system state, context, errors, responses, meta, and fetch utilities.
 */
export const useSystem = () => {
  const {
    isReady: brandIsReady,
    getCountry: getDefaultCountry,
    getCurrencyId: getDefaultCurrency,
  } = useBrand();

  // --- state

  const service = interpret(systemMachine, { devTools: false }).start();
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
    isLoading: [
      "currencies.loading",
      "billingCycles.loading",
      "countries.loading",
      "regions.loading",
      "languages.loading",
      "statuses.loading",
      "departments.loading",
    ].some(state.value.matches),
    isReady: isReady(),
    isComplete: [
      "currencies.complete",
      "billingCycles.complete",
      "countries.complete",
      "regions.complete",
      "languages.complete",
      "statuses.complete",
      "departments.complete",
    ].every(state.value.matches),
    hasErrors: [
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
    ].some(state.value.matches),
  }));

  // --- context

  const context = computed(() => state.value.context);
  const errors = computed(() => state.value.context?.error);
  const responses = computed(() => omit(state.value.context, "error"));
  const billingCycles = computed(() => state.value.context.billingCycles);
  const currencies = computed(() => state.value.context.currencies);
  const countries = computed(() => state.value.context.countries);
  const languages = computed(() => state.value.context.languages);
  const statuses = computed(() => state.value.context.statuses);
  const departments = computed(() => state.value.context.departments);

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
        newstate => [`${node}.idle`, `${node}.complete`].some(newstate.matches),
        { timeout: Infinity }
      ).catch(() => {
        throw new DetailedError(
          `[headless] fetch on useSystem timed out while fetching "${node}"`,
          responseCodes.Timeout
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
            reject(get(state, `context.error.${node}`));
          }
        })
        .catch(error => {
          reject(error);
        });
    });
  };

  // --- methods

  function getCurrency(value?: string) {
    // if we are not passed a country, then we need to get the default country
    value ??= getDefaultCurrency();

    if (value?.length == 3)
      return find(state.value.context.currencies, ["code", value]);
    return find(state.value.context.currencies, ["id", value]);
  }

  function getBillingCycle(value: number) {
    return find(state.value.context.billingCycles, ["months", value]);
  }

  function getCountry(value?: string): ICountry {
    // if we are not passed a country, then we need to get the default country
    value ??= getDefaultCountry();

    if (value?.length == 2)
      return (
        (find(state.value.context.countries, ["code", value]) as ICountry) ??
        getDefaultCountry()
      );
    return (
      (find(state.value.context.countries, ["id", value]) as ICountry) ??
      getDefaultCountry()
    );
  }

  async function fetchRegions(country?: ICountry | string) {
    // if we are not passed a country, then we need to get the default country

    if (isEmpty(country)) {
      // ensure we have our brand settings loaded before we try to get the default country
      await isReady().catch(error => Promise.reject(error));
      country = getDefaultCountry();
    }

    //  ensure we have a country object in order to fetch regions
    if (isString(country)) country = getCountry(country);

    if (!country)
      return Promise.reject(new Error("Country not found, cannot get regions"));

    return fetch("regions", getRegions, country);
  }

  function getRegions(value: string | ICountry) {
    return get(
      state.value?.context?.regions,
      isString(value) ? value : value.code
    );
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
    return find(state.value.context.languages, ["code", value]);
  }

  function getStatus(value: string) {
    return find(state.value.context.statuses, ["code", value]);
  }

  function getDepartment(value: string) {
    return find(state.value.context.departments, ["code", value]);
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
     * Computed meta information about the brand state (errors, loading, etc).
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

    /**
     * Computed property to the structured responses from the state machine context, excluding errors.
     */
    responses,

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
    fetchCountries: async () => fetch("countries", () => countries.value),

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
export type UseSystemReturn = ReturnType<typeof useSystem>;
