// --- external
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import routingEngine from "./routingEngine.machine";
import flows from "./flow.default";
export * from "./types";

// --- utils

// --------------------------------------------------------
// create a global instance of the basket machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

// @ts-ignore
const service = interpret(routingEngine.withContext({ flows }), {
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

    // --- methods

    // ---
    destroy: () => service.stop(),
  };
};
