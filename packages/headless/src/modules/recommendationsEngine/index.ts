// --- external
import { interpret } from "xstate";

// --- internal
import recommendationsEngine from "./recommendationsEngine.machine";
export * from "./types";
// --- utils

// --------------------------------------------------------
// create a global instance of the basket machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

// @ts-ignore
const service = interpret(recommendationsEngine, { devTools: true });

// --------------------------------------------------------

export const useRecommendationsEngine = () => {
  // --------------------------------------------------------

  return {
    service: service.start(),
    getSnapshot: () => service.getSnapshot(),
    // ---
    destroy: () => service.stop(),
  };
};
