// --- external
import { interpret } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import recommendationsEngine from "./recommendationsEngine.machine";
export * from "./types";

// --- utils
import { some, last } from "lodash-es";

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
    isReady: async () =>
      waitFor(
        service,
        state => ["available", "unavailable", "error"].some(state.matches),
        { timeout: Infinity }
      ),

    // ---

    reset: function () {
      service.send({
        type: "RESET",
      });
    },

    /**
     * Add a product to the basket.
     * @param {number} index - The index of the recommendations to add.
     *
     **/
    add: function (id: string) {
      service.send({
        type: "ADD",
        data: id,
      });

      return waitFor(service, state => !state.matches("processing")).then(
        state => {
          if (["error", "available.error"].some(state.matches)) {
            return Promise.reject(state.context.error);
          }
          return Promise.resolve();
        }
      );
    },

    remove: function (value: string) {
      service.send({
        type: "REMOVE",
        data: value,
      });
    },

    fetchRecommendation: function (value: string) {
      service.send({
        type: "FETCH",
        data: value,
      });
    },

    /*
     * Mark the recommendations as seen. Optinally provide an array of ids to mark as seen.
     * If no values are provided, all recommendations will be marked as seen.
     * @param {string[]} values - Optional arrat of ids of the recommendations to mark as seen.
     */
    seen: function (values?: string[]) {
      service.send({
        type: "SEEN",
        data: values,
      });
    },

    cancel: function () {
      service.send({
        type: "CANCEL",
      });
    },

    syncBasket: function () {
      service.send({
        type: "SYNC",
      });
    },
    // ---
    destroy: () => service.stop(),
  };
};
