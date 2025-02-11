// --- external
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import listingsMachine from "../listings.machine";
import services from "./services";
import { actions } from "./actions";

// --- utils
import { map } from "lodash-es";

// --- types

// -----------------------------------------------------------------------------
// create a global instance of the system machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

let state: any = null;

const service = interpret(
  listingsMachine.withConfig({
    actions: actions as any,
    services: services as any,
  }),
  {
    devTools: false,
  }
).onTransition(newState => (state = newState));

// -----------------------------------------------------------------------------

export const usePlaces = () => {
  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    // ---
    isReady: async () =>
      waitFor(
        service,
        state =>
          state.matches("available") && !state.matches("available.loading")
      ),
    getSnapshot: () => state,
    getItemsSnapshot: () => state?.context?.items,
    getItems: () => map(state?.context?.items, "state.context.model"),
    getSelected: () => state?.context?.selected,
    getDefault: () => null, // we have no default in this machine,
    search: async (data: any) => {
      service.send({ type: "FILTER", data });
      return waitFor(service, state =>
        state.matches("available.filtered")
      ).then(() => {
        return state.context.items;
      });
    },
    getPlaceDetails: (id: any) =>
      services.parse(state?.context, {
        type: "PARSE_PLACE",
        data: { place: id },
      }),
    reset: () => service.send({ type: "REFRESH" }),
  };
};
