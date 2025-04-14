// --- external
import { AnyEventObject, interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- exports
export * from "./upload/useSystemUpload";
export * from "./recaptcha/useSystemRecaptcha";
export * from "./i18n/useSystemI18n";
export * from "./analytics/useDataLayer";
export * from "./analytics/useTracking";

// --- internal
import systemMachine from "./system.machine";
import { useBrand } from "../brand";

// --- utils
import { find, isString, get, isEmpty, some, isArray } from "lodash-es";
import type { ICountry, IRegion } from "@upmind-automation/types";

// --- types

// ---  create a global instance of the system machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

const service = interpret(systemMachine, { devTools: false });
// ---
export const useSystem = () => {
  const {
    isReady,
    getCountry: getDefaultCountry,
    getCurrencyId: getDefaultCurrency,
  } = useBrand();

  // --- Helpers

  async function fetch(
    node: string,
    getValues: (data: any) => any,
    data?: any
  ): Promise<any> {
    // ---
    // then  check if we have the regions for this country and return them
    const values = getValues(data);

    if (values) return Promise.resolve(values);

    // Are we already fetching this node?
    // if we are, then wait for the fetch to complete

    if (service.getSnapshot().matches(`${node}.loading`)) {
      await waitFor(service, newstate =>
        [`${node}.idle`, `${node}.complete`].some(newstate.matches)
      );
      return fetch(node, getValues, data);
    }

    // ---
    // if we dont have the regions for this country, then we need to fetch them
    service.send({
      type: `${node.toUpperCase()}.GET`,
      data,
    });

    // finally ... await the response
    return new Promise((resolve, reject) => {
      waitFor(
        service,
        state => [`${node}.processed`, `${node}.error`].some(state.matches)
        // { timeout: Infinity }
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
  }

  // --- Methods

  const getCurrencies = () => service.getSnapshot().context.currencies;
  const getCurrency = (value?: string) => {
    const state = service.getSnapshot();
    // if we are not passed a country, then we need to get the default country
    value ??= getDefaultCurrency();

    if (value?.length == 3)
      return find(state.context.currencies, ["code", value]);
    return find(state.context.currencies, ["id", value]);
  };
  // ---

  const getBillingCycles = () => service.getSnapshot().context.billingCycles;
  const getBillingCycle = (value: any) =>
    find(service.getSnapshot().context.billingCycles, ["months", value]);
  // ---

  const getCountries = () => service.getSnapshot().context.countries;
  const getCountry = (value?: string) => {
    const state = service.getSnapshot();
    // if we are not passed a country, then we need to get the default country
    value ??= getDefaultCountry();

    if (value?.length == 2)
      return find(state.context.countries, ["code", value]);
    return find(state.context.countries, ["id", value]);
  };
  // ---

  const fetchRegions = async (country?: ICountry | string) => {
    // if we are not passed a country, then we need to get the default country

    if (isEmpty(country)) {
      // ensure we have our brand settings loaded before we try to get the default country
      await isReady().catch(error => Promise.reject(error));
      country = getDefaultCountry();
    }

    //  ensure we have a country object in order to fetch regions
    if (isString(country)) country = getCountry(country);

    if (!country)
      return Promise.reject("Country not found, cannot get regions");

    return fetch("regions", getRegions, country);
  };

  const getRegions = (value: string | ICountry) =>
    get(
      service.getSnapshot()?.context?.regions,
      isString(value) ? value : value.code
    );

  const getRegion = (values: string | string[], country: string | ICountry) => {
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
  };
  // ---

  const getLanguages = () => service.getSnapshot().context.languages;
  const getLanguage = (value: any) =>
    find(service.getSnapshot().context.languages, ["code", value]);
  // ---

  const getStatuses = () => service.getSnapshot().context.statuses;
  const getStatus = (value: any) =>
    find(service.getSnapshot().context.statuses, ["code", value]);
  // ---

  const getDepartments = () => service.getSnapshot().context.departments;
  const getDepartment = (value: any) =>
    find(service.getSnapshot().context.departments, ["code", value]);
  // ---------------------------------------------------------------------------
  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    // ---
    isReady,
    getSnapshot: service.getSnapshot,

    // ---
    getCurrencies,
    getCurrency,
    // ---
    getBillingCycles,
    getBillingCycle,
    // ---
    fetchCountries: async () => fetch("countries", getCountries),
    getCountries,
    getCountry,
    // ---
    fetchRegions,
    getRegions,
    getRegion,
    // ---
    fetchLanguages: async () => fetch("languages", getLanguages),
    getLanguages,
    getLanguage,
    // ---
    fetchStatuses: async () => fetch("statuses", getStatuses),
    getStatuses,
    getStatus,
    // ---
    fetchDepartments: async () => fetch("departments", getDepartments),
    getDepartments,
    getDepartment,
  };
};
