// --- external
import { interpret, InterpreterStatus } from "xstate";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import recommendationsEngine from "./recommendationsEngine.machine";
import { isEmpty, some } from "lodash-es";
export * from "./types";

// --- utils

// -----------------------------------------------------------------------------

// create a global instance of the basket machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

const service = interpret(recommendationsEngine, { devTools: false });

// -----------------------------------------------------------------------------

export const useRecommendationsEngine = () => {
  return {
    service: service.start(),
    getSnapshot: () => service.getSnapshot(),
    isReady: async () =>
      waitFor(
        service,
        state => ["available", "unavailable", "error"].some(state.matches),
        { timeout: Infinity }
      ),

    hasRecommendations: () => {
      const state = service.getSnapshot();
      return !isEmpty(state.context?.raw?.related);
    },

    hasUnseenRecommendations: () => {
      const state = service.getSnapshot();

      return (
        !isEmpty(state.context?.recommendations) &&
        some(
          state.context?.recommendations,
          ({ meta }) => !meta?.added && !meta?.seen
        )
      );
    },
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

      return waitFor(service, state => !state.matches("processing"), {
        timeout: Infinity,
      }).then(state => {
        if (["error", "configuring"].some(state.matches)) {
          return Promise.reject(state.context.error);
        }
        return Promise.resolve();
      });
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
    stop: () => service.status == InterpreterStatus.Running && service.stop(),
  };
};
