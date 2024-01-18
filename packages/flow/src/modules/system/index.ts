// --- external
import { interpret } from "xstate";

// --- internal
export * from "./upload";
export * from "./place";
import systemMachine from "./system.machine";

// --- utils
import { find, values } from "lodash-es";
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
  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    // ---

    getSnapshot: () => state,

    // ---

    getCurrencies: () => state.context.currencies,
    getCurrency: code => find(state.context.currencies, ["code", code]),
    // ---

    getBillingCycles: () => state.context.billingCycles,
    getBillingCycle: months =>
      find(state.context.billingCycles, ["months", months]),
    // ---

    fetchCountries: () => service.send({ type: "COUNTRIES.GET" }),
    getCountries: () => state.context.countries,
    getCountry: code => find(state.context.countries, ["code", code]),
    // ---

    fetchRegions: (country: ICountry) =>
      service.send({ type: "REGIONS.GET", data: country }),
    getRegions: () => state.context.regions,
    getRegion: code => find(values(state.context.regions), ["code", code]),
    // ---

    fetchLanguages: () => service.send({ type: "LANGUAGES.GET" }),
    getLanguages: () => state.context.languages,
    getLanguage: code => find(state.context.languages, ["code", code]),
    // ---

    fetchStatuses: () => service.send({ type: "STATUSES.GET" }),
    getStatuses: () => state.context.statuses,
    getStatus: code => find(state.context.statuses, ["code", code]),
    // ---

    fetchDepartments: () => service.send({ type: "DEPARTMENTS.GET" }),
    getDepartments: () => state.context.departments,
    getDepartment: code => find(state.context.departments, ["code", code])
  };
};
