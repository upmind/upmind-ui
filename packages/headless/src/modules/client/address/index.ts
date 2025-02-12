// --- external
import type { ActorRef, AnyEventObject } from "xstate";
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import listingsMachine from "../listings.machine";
import services from "./services";
import { ListingActions as actions } from "./actions";

// --- utils
import { find, map, compact } from "lodash-es";

// --- types
import type { IAddressData } from "./types";
import type { IAddress } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
// create a global instance of the system machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

const service = interpret(
  listingsMachine.withConfig({
    actions: actions as any,
    services: services as any,
  }),
  {
    devTools: false,
  }
);

// -----------------------------------------------------------------------------

export const useClientAddresses = () => {
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
    getItem: (id: any) =>
      find(service.getSnapshot()?.context?.items, ["id", id])?.getSnapshot()
        ?.context?.model,
    getSelected: () => {
      return waitFor(
        service,
        state =>
          state.matches("available") && !state.matches("available.loading")
      ).then(state => {
        // first try to get the selected address from the context
        if (state?.context?.selected) return state.context.selected;

        // if no selected address, try to get the default address
        const defaultAddress = find(
          state?.context?.items,
          "state.context.model.default"
        );

        // if we have a default address, select it
        if (defaultAddress) {
          service.send({ type: "SELECT", data: defaultAddress.id });
          return defaultAddress;
        }
      });
    },
    getDefault: () =>
      find(
        service.getSnapshot()?.context?.items,
        "state.context.model.default"
      )?.getSnapshot()?.context?.model,

    search: async (data: any) => {
      service.send({ type: "FILTER", data });
      return waitFor(service, state =>
        state.matches("available.filtered")
      ).then(state => {
        return state.context.items;
      });
    },
    find: (data: IAddressData) =>
      services.find(service.getSnapshot().context, {
        type: "FIND",
        data,
      } as AnyEventObject),
    add: (data: any) => services.add(data),
  };
};
