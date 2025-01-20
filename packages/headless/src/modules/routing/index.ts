// --- external
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import routingEngine from "./routingEngine.machine";
export * from "./flows";
export * from "./types";

// --- utils
import {
  awaitResolved,
  useRoutePendingProducts,
  useRouteRequiresAction,
  useRouteQueryParams,
} from "./utils";
export * from "./utils";

// --- types
import type { ROUTE, Flow, Route } from "./types";
import { isEmpty, get, some } from "lodash-es";
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
    exists: (name: ROUTE) => {
      const state = service.getSnapshot();
      const flows = get(state, "context.flows", []);
      return some(flows, flow => flow.name === name);
    },
    // --- methods
    register: (flows: Flow[]) => {
      service.send({ type: "REGISTER", data: flows });
    },
    next: (route: Route) => {
      service.send({ type: "NEXT", data: route });
      return awaitResolved(service);
    },
    back: (route: Route) => {
      service.send({ type: "BACK", data: route });
      return awaitResolved(service);
    },
    resolve: async (name: ROUTE, route: Route) => {
      service.send("RESOLVE", { data: { name, route } });
      return awaitResolved(service);
    },
    // ---
    usePendingProducts: useRoutePendingProducts,
    useRequiresAction: useRouteRequiresAction,
    useQueryParams: useRouteQueryParams,
    // ---
    destroy: () => service.stop(),
  };
};
