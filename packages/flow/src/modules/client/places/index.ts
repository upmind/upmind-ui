// --- external
import { interpret } from "xstate";

// --- internal
import listingsMachine from "../listings.machine";
import services from "./services";
import { actions } from "./actions";

// --- utils

// --- types

// --------------------------------------------------------
// create a global instance of the system machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

let state = null;

const service = interpret(listingsMachine.withConfig({ actions, services }), {
  devTools: true
}).onTransition(newState => (state = newState));

// --------------------------------------------------------

export const usePlaces = () => {
  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    // ---
    getSnapshot: () => state,
    getItems: () => state?.context?.items,
    getSelected: () => state?.context?.selected,
    getDefault: () => null, // we have no default in this machine,
    getPlaceDetails: id =>
      services.parse(state?.context, { data: { place: id } }),
    reset: () => service.send("REFRESH")
  };
};
