// --- external
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import routingEngine from "./routingEngine.machine";
export * from "./flows";
export * from "./types";

// --- utils
export * from "./utils";

// --- types
import type { ROUTE, Flow } from "./types";
import { isEmpty, get } from "lodash-es";
// --------------------------------------------------------
// create a global instance of the basket machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

// @ts-ignore
const service = interpret(routingEngine, {
  devTools: true,
});

// --------------------------------------------------------

export const useRoutingEngine = () => {
  // --------------------------------------------------------

  return {
    service: service.start(),
    getSnapshot: () => service.getSnapshot(),
    isReady: async () =>
      waitFor(service, state => !["syncing"].some(state.matches), {
        timeout: Infinity,
      }),
    //  ---
    hasFlows: () => {
      const state = service.getSnapshot();
      return !isEmpty(state?.context?.flows);
    },
    getFlows: () => {
      const state = service.getSnapshot();
      return get(state, "context.flows", []);
    },
    // --- methods
    register: (flows: Flow[]) => {
      service.send("REGISTER", { data: flows });
    },
    next: () => service.send("NEXT"),
    back: () => service.send("BACK"),
    navigate: async (route: ROUTE) => {
      service.send("NAVIGATE", { data: route });
      await waitFor(
        service,
        state => !["navigating", "calculating"].some(state.matches),
        { timeout: Infinity }
      );
      const target = get(service.getSnapshot(), "context.currentFlow");

      if (route == target?.id) return Promise.resolve(target);
      else return Promise.reject(target);
    },

    // ---
    destroy: () => service.stop(),
  };
};
