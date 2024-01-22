// --- external
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
export * from "./upload";
export * from "./place";
import systemMachine from "./system.machine";
import { useBrand } from "../brand";

// --- utils
import { find, values, isString, get, isEmpty } from "lodash-es";
import type { ICountry } from "./types";

// --- types

// --------------------------------------------------------
// create a global instance of the system machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

let state = null;

const service = interpret(systemMachine, { devTools: true }).onTransition(
  newState => (state = newState)
);
// --------------------------------------------------------

export const useSystem = () => {
  const { getCountry: getDefaultCountry, service: brandService } = useBrand();

  // --- Helpers

  async function fetch(node: string, getValues: Function, data?: any) {
    // ---
    // then  check if we have the regions for this country and return them
    const values = getValues(data);

    if (values) return Promise.resolve(values);

    // ---
    // if we dont have the regions for this country, then we need to fetch them
    service.send({
      type: `${node.toUpperCase()}.GET`,
      data
    });

    // finally ... await the response
    return new Promise((resolve, reject) => {
      waitFor(service, state =>
        [`${node}.processed`, `${node}.error`].some(state.matches)
      )
        .then(() => {
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

  const getCurrencies = () => state.context.currencies;
  const getCurrency = value => find(state.context.currencies, ["code", value]);
  // ---

  const getBillingCycles = () => state.context.billingCycles;
  const getBillingCycle = value =>
    find(state.context.billingCycles, ["months", value]);
  // ---

  const getCountries = () => state.context.countries;
  const getCountry = (value: string) => {
    if (value?.length == 2)
      return find(state.context.countries, ["code", value]);
    return find(state.context.countries, ["id", value]);
  };
  // ---

  const getRegions = value =>
    get(state.context.regions, isString(value) ? value : value.code);

  const getRegion = value =>
    find(values(state.context.regions), ["code", code]);
  // ---

  const getLanguages = () => state.context.languages;
  const getLanguage = value => find(state.context.languages, ["code", code]);
  // ---

  const getStatuses = () => state.context.statuses;
  const getStatus = value => find(state.context.statuses, ["code", code]);
  // ---

  const getDepartments = () => state.context.departments;
  const getDepartment = value =>
    find(state.context.departments, ["code", code]);
  // --------------------------------------------------------

  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    // ---

    getSnapshot: () => state,

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
    getDefaultCountry,
    // ---
    fetchRegions: async (country?: ICountry | string) => {
      // if we are not passed a country, then we need to get the default country
      if (isEmpty(country)) {
        // ensure we have our brand settings loaded before we try to get the default country
        if (!["settings.complete"].some(brandService.state.matches)) {
          await waitFor(brandService, state =>
            ["settings.complete"].some(state.matches)
          );
        }

        country = getDefaultCountry();
      }

      //  ensure we have a country object in order to fetch regions
      if (isString(country)) country = getCountry(country);

      if (!country)
        return Promise.reject("Country not found, cannot get regions");

      return fetch("regions", getRegions, country);
    },
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
    getDepartment
  };
};
