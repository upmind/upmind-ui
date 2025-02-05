// --- external
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import listingsMachine from "../listings.machine";
import services from "./services";
import { ListingActions as actions } from "./actions";

// --- utils
import { find, map, compact } from "lodash-es";

// --- types
// @ts-ignore
import type { IAddressData, IAddress } from "./types";

// -----------------------------------------------------------------------------
// create a global instance of the system machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

let state: any = null;

// @ts-ignore
const service = interpret(listingsMachine.withConfig({ actions, services }), {
  devTools: false,
}).onTransition(newState => {
  state = newState;
});

// -----------------------------------------------------------------------------

/**
 * @ignore
 */
export const useClientUnifiedAddresses = () => {
  return {
    service: service.start(), // allow for interpreting the machine + inspecting it
    // ---
    isReady: async () =>
      waitFor(
        service,
        state =>
          state.matches("available") && !state.matches("available.loading"),
        {
          timeout: Infinity,
        }
      ),
    getSnapshot: () => state,
    getItemsSnapshot: () => state?.context?.items,
    getItems: () => compact(map(state?.context?.items, "state.context.model")),
    getItemSnapshot: (id: any) => find(state?.context?.items, ["id", id]),
    getItem: (id: any) =>
      find(state?.context?.items, ["id", id])?.state?.context?.model,
    getSelected: () => {
      return waitFor(
        service,
        state =>
          state.matches("available") && !state.matches("available.loading")
      ).then(() => {
        // first try to get the selected address from the context
        if (state?.context?.selected) return state.context.selected;

        // if no selected address, try to get the default address
        const defaultAddress = find(
          state?.context?.items,
          item => item.state?.context?.model?.default
        );

        // if we have a default address, select it
        if (defaultAddress) {
          service.send({ type: "SELECT", data: defaultAddress.id });
          return defaultAddress;
        }
      });
    },
    getDefault: () =>
      find(state?.context?.items, "state.context.model.default"),

    search: async (data: any) => {
      service.send({ type: "FILTER", data });
      return waitFor(service, state =>
        state.matches("available.filtered")
      ).then(() => {
        return state.context.items;
      });
    },
    find: (data: IAddressData) => services.find(state.context, { data }),
    add: (data: IAddress) => services.add(data),
  };
};
