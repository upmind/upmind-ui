// --- external
import { computed } from "vue";
import { interpret, InterpreterStatus } from "xstate";
import { useActor } from "@xstate/vue";
import { waitFor } from "xstate/lib/waitFor";

// --- internal
import recommendationsEngine from "./recommendationsEngine.machine";

// --- utils
import { isEmpty, some, filter } from "lodash-es";
import {
  useContext,
  stopService,
  contextValue,
  stateMatches,
  contextMatches
} from "../../utils";

// --- types
import type { InterpreterFrom } from "xstate";
import { ProductModel } from "../product";
import { Recommendation, RecommendationsEngineContext } from "./types";

// -----------------------------------------------------------------------------

// create a global instance of the basket machine
// and a global object to store state
// NB dont automatically start the machine as in order for the inspector to work
// it needs to be started after the inspect service is created, so we only start it when we need it

const service = interpret(recommendationsEngine, { devTools: false });

// -----------------------------------------------------------------------------

export const useRecommendations = () => {
  if (service.status === InterpreterStatus.NotStarted) service.start();

  const { state, send } = useActor(service);

  // --- state

  async function isReady(): Promise<boolean> {
    return waitFor(
      service,
      state => stateMatches(state, ["available", "unavailable", "error"]),
      { timeout: Infinity }
    ).then(state => {
      if (stateMatches(state, ["error"])) return false;
      return true;
    });
  }

  const meta = computed(() => ({
    hasErrors: stateMatches(state, ["error"]),
    hasRecommendations:
      contextMatches(state, "recommendations") &&
      some(recommendations.value, ({ meta }) => !meta?.added && !meta?.seen),
    hasUnseenRecommendations: some(
      recommendations.value,
      ({ meta }) => !meta?.seen
    ),
    isConfiguring: stateMatches(state, ["configuring"]),
    isLoading: stateMatches(state, ["subscribing"]),
    isProcessing: stateMatches(state, ["processing"]),
    isRefreshing: stateMatches(state, ["refreshing"])
  }));

  // --- context

  const context = useContext<RecommendationsEngineContext>(state);

  const basketItem = useContext<RecommendationsEngineContext["basketItem"]>(
    state,
    "basketItem"
  );

  const errors = useContext<RecommendationsEngineContext["error"]>(
    state,
    "error"
  );

  const recommendations = useContext<
    RecommendationsEngineContext["recommendations"]
  >(state, "recommendations");

  // --- methods

  function add(id: string) {
    send({ type: "ADD", data: id });
    return waitFor(service, s => !stateMatches(s, ["processing"]), {
      timeout: Infinity
    }).then(s => {
      if (stateMatches(s, ["error", "configuring"])) {
        return Promise.reject(contextValue(s, "error"));
      }
      return Promise.resolve();
    });
  }

  function cancel() {
    send({ type: "CANCEL" });
  }

  function fetchRecommendation(value: string) {
    send({ type: "FETCH", data: value });
  }

  function remove(value: string) {
    send({ type: "REMOVE", data: value });
  }

  function reset() {
    send({ type: "RESET" });
  }

  function seen(values?: string[]) {
    send({ type: "SEEN", data: values });
  }

  function stop() {
    stopService(service);
  }

  // -----------------------------------------------------------------------------
  return {
    // --- state

    state, // rare export of state to allow for us eto be able to re-use this compsable in the useProductRecommendations
    /**
     * Waits for the recommendations engine to be ready (available, unavailable, or error state).
     * @returns {Promise<boolean>} Resolves true if ready, false if error.
     */
    isReady,

    /**
     * Meta information about the recommendations engine state.
     * @typedef {Object} RecommendationsMeta
     * @property {boolean} hasErrors - True if the engine is in an error state.
     * @property {boolean} hasRecommendations - True if there are recommendations.
     * @property {boolean} hasUnseenRecommendations - True if there are unseen recommendations.
     * @property {boolean} isConfiguring - True if the engine is configuring.
     * @property {boolean} isLoading - True if the engine is loading.
     * @property {boolean} isProcessing - True if the engine is processing.
     * @property {boolean} isRefreshing - True if the engine is refreshing.
     */
    meta,

    // --- context

    /**
     * The current context
     */
    context,

    /** The current basket item context. */
    basketItem,

    /** Any error returned by the engine. */
    errors,

    /** The recommendations list. */
    recommendations,

    // --- methods

    /**
     * Adds a product to the recommendations engine.
     * @param {string} id - The id of the product to add.
     */
    add,

    /** Cancels the current recommendations process. */
    cancel,

    /** Fetches a recommendation by value. */
    fetchRecommendation,

    /** Removes a recommendation by value. */
    remove,

    /** Resets the recommendations engine. */
    reset,

    /** Marks recommendations as seen. */
    seen,

    /** Stops the recommendations engine  */
    stop
  };
};

/**
 * The return type of the `useRecommendations` composable, ensuring type safety for consumers.
 */
export type UseRecommendations = ReturnType<typeof useRecommendations>;
