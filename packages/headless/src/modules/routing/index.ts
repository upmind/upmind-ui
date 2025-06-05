// --- external
import { interpret, InterpreterStatus } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import routingEngine from "./routingEngine.machine";
export * from "./flows";
export * from "./types";
export * from "./useRoutingEngine";
export * from "./useProductsRequiringAction";
export * from "./useRouteQueryParams";

// --- utils
import { stopService } from "../../utils";
import { awaitResolved, useRouteQueryParams } from "./utils";
export { useRouteRequiresAction, useRouteQueryParams } from "./utils";

// --- types
import type { InterpreterFrom } from "xstate";
import type { ROUTE, Flow, Route, Target } from "./types";
import { isEmpty, get, some } from "lodash-es";
import { ResponseError } from "../query";
export type RouteQueryParams = typeof useRouteQueryParams;

// -----------------------------------------------------------------------------

// create a global instance of the basket machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

const service = interpret(routingEngine, { devTools: false });

// -----------------------------------------------------------------------------

export const useRoutingEngine = () => {
  return {
    service: service.start(),
    getSnapshot: () => service.getSnapshot(),
    isReady: async () =>
      waitFor(service, state => !["subscribing"].some(state.matches), {
        timeout: Infinity,
      }).then(state => {
        if (["unavailable"].some(state.matches))
          return Promise.reject(new Error("Routing Engine is not available"));

        return state;
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
    currentFlow: () => {
      const state = service.getSnapshot();
      const currentFlow = get(state, "context.currentFlow");
      return currentFlow;
    },
    currentRoute: () => {
      const state = service.getSnapshot();
      const currentRoute = get(state, "context.currentRoute");
      return currentRoute;
    },
    getErrors: (): ResponseError | undefined => {
      const state = service.getSnapshot();
      return get(state, "context.error", undefined) as ResponseError;
    },
    // --- methods
    register: (flows: Flow[]) => {
      service.send({ type: "REGISTER", data: flows });
    },
    next: (route: Route, event?: any) => {
      service.send({ type: "NEXT", data: { route, event } });
      return awaitResolved(service);
    },
    back: (route: Route, event?: any) => {
      service.send({ type: "BACK", data: { route, event } });
      return awaitResolved(service);
    },
    resolve: async (name: ROUTE | string, route: Route, event?: any) => {
      service.send("RESOLVE", { data: { name, route, event } });
      return awaitResolved(service);
    },
    // ---
    useQueryParams: useRouteQueryParams as RouteQueryParams,
    // ---
    stop: () => stopService(service as InterpreterFrom<any>),
  };
};
