// --- external
import { interpret } from "xstate";

// --- internal
import systemMachine from "./system.machine";

// --- utils
import { find } from "lodash-es";

// --------------------------------------------------------
// create a global instance of the system machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

let state = null;

const service = interpret(systemMachine, { devTools: false }).onTransition(
  newState => (state = newState)
);
// --------------------------------------------------------

export const useSystem = () => {
  // --------------------------------------------------------
  // methods

  // --------------------------------------------------------

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
      find(state.context.billingCycles, ["months", months])
  };
};
