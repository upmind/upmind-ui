// --- external
import { interpret } from "xstate";

// --- internal
import addressesMachine from "./addresses.machine";

// --- utils

// --- types

// --------------------------------------------------------
// create a global instance of the system machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

let state = null;

const service = interpret(addressesMachine, { devTools: true }).onTransition(
  newState => (state = newState)
);

// --------------------------------------------------------

export const useClientAddresses = () => {
  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    // ---
    getSnapshot: () => state
  };
};
