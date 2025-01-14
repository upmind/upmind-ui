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
import type { ROUTE, Flow, Route } from "./types";
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
      service.send({ type: "REGISTER", data: flows });
    },
    next: (route: Route) => service.send({ type: "NEXT", data: route }),
    back: (route: Route) => service.send({ type: "BACK", data: route }),
    resolve: async (id: ROUTE, route: Route) => {
      service.send("RESOLVE", { data: { id, route } });
      await waitFor(
        service,
        state => !["resolving", "calculating"].some(state.matches),
        { timeout: Infinity }
      );
      const target = get(service.getSnapshot(), "context.currentFlow");

      // if our target is the same as the requested id, then we are good
      // otherwise we need to reject the promise with the new target
      if (id == target?.id) return Promise.resolve(target);
      else return Promise.reject(target);
    },
    // ---
    destroy: () => service.stop(),
  };
};
