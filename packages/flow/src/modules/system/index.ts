// --- external
import { interpret } from "xstate";

// --- internal
import systemMachine from "./system.machine";
import uploadMachine from "./upload.machine";

// --- utils
import { find } from "lodash-es";

// --- types
import type { ImageObjectTypes } from "./types.d";

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

// system uplaods is NOT a global insance, and is always instantiated as a new machine
// this is because we need to be able to have multiple uploads happening at once
// and we need to be able to start and stop them individually
export const useSystemUpload = () => {
  let state = null;

  // const service = interpret(uploadMachine.withContext(context), {
  const service = interpret(uploadMachine, {
    devTools: true
  })
    .onTransition(newState => (state = newState))
    .start();

  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    // ---
    getSnapshot: () => state,
    destroy: () => service.stop()
  };
};
