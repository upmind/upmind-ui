// --- external
import { interpret } from "xstate";

// --- internal
import listingsMachine from "../listings.machine";
import services from "./services";
import { ListingActions as actions } from "./actions";

// --- utils

// --- types

// --------------------------------------------------------

// this is NOT a global instance, and is always instantiated as a new machine
// this is because we need to be able to have multiple instances happening at once
// and we need to be able to start and stop them individually

export const useClientPhones = () => {
  let state = null;

  const service = interpret(listingsMachine.withConfig({ actions, services }), {
    devTools: true
  }).onTransition(newState => (state = newState));

  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    // ---
    getSnapshot: () => state
  };
};
