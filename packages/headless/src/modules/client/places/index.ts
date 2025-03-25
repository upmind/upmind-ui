// --- external
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import services from "./services";
import { actions } from "./actions";
import itemMachine from "../item.machine";

// --- utils
import { find, map, compact } from "lodash-es";

// --- types

// -----------------------------------------------------------------------------
// create a global instance of the system machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

const service = interpret(
  itemMachine.withConfig({
    actions: actions as any,
    services: services as any,
  }),
  {
    devTools: false,
  }
);

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
    getSnapshot: service.getSnapshot,
    getItemsSnapshot: () => service.getSnapshot()?.context?.items,
    getItems: () =>
      compact(
        map(service.getSnapshot()?.context?.items, "state.context.model")
      ),
    getItemSnapshot: (id: any) =>
      find(service.getSnapshot()?.context?.items, ["id", id]),
    getSelected: () => service.getSnapshot()?.context?.selected,
    getDefault: () => null, // we have no default in this machine,
    search: async (data: any) => {
      service.send({ type: "FILTER", data });
      return waitFor(service, state =>
        state.matches("available.filtered")
      ).then(state => {
        return state.context.items;
      });
    },
    getPlaceDetails: (id: any) =>
      services.parse(service.getSnapshot()?.context, {
        type: "PARSE_PLACE",
        data: { place: id },
      }),
    reset: () => service.send({ type: "REFRESH" }),
  };
};
