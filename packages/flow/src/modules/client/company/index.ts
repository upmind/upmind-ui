// --- external
import { interpret } from "xstate";

// --- internal
import listingsMachine from "../listings.machine";
import services from "./services";
import { ListingActions as actions } from "./actions";

// --- utils
import { find } from "lodash-es";

// --- types

// --------------------------------------------------------
// create a global instance of the system machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

let state = null;

const service = interpret(listingsMachine.withConfig({ actions, services }), {
  devTools: false
}).onTransition(newState => (state = newState));

// --------------------------------------------------------

export const useClientCompanies = () => {
  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    // ---
    getSnapshot: () => state,
    getItems: () => state?.context?.items,
    getItem: id => find(state?.context?.items, ["id", id]),
    getSelected: () => state?.context?.selected,
    getDefault: () => find(state?.context?.items, "state.context.model.default")
  };
};
