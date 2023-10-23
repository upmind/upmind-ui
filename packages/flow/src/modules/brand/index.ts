// --- external
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import brandMachine from "./brand.machine";
import { BrandConfigKeys } from "./services";
export { BrandConfigKeys } from "./services";

// --- utils
import { pick, isArray, find } from "lodash-es";

// --------------------------------------------------------
// create a global instance of the brand machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

let state = null;

const service = interpret(brandMachine, { devTools: false }).onTransition(
  newState => (state = newState)
);
// --------------------------------------------------------

export const useBrand = () => {
  // --------------------------------------------------------
  // methods

  // --------------------------------------------------------

  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    // ---
    getSnapshot: () => state,
    getConfig: async (keys: BrandConfigKeys) => {
      // ensure we have an array of keys
      keys = isArray(keys) ? keys : [keys];

      // request the keys from the machine,
      // It will handle any keys that have already been requested
      service.send({ type: "CONFIG.GET", data: keys });

      // then we await the state of the request to be processed/cached
      await waitFor(service, state =>
        ["config.complete", "config.error"].some(state.matches)
      );

      // finally return the requested keys from the config
      return pick(state.context, keys);
    },
    // ---
    // syntax sugar
    getCurrencies: () => state.context.currencies,
    getCurrency: code => find(state.context.currencies, ["code", code]),

    getBillingCycles: () => state.context.billingCycles,
    getBillingCycle: months =>
      find(state.context.billingCycles, ["months", months])
  };
};
