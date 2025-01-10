// --- external
import { createMachine, assign, spawn, actions } from "xstate";
const { sendTo } = actions;

// --- internal
import services from "./services";
import { basketSubscription } from "../basket/helper";

// --- utils
import { useTime } from "../../utils";

// --- types

import type { RoutingEngineContext, Flow } from "./types";

// --------------------------------------------------------

export default createMachine(
  {
    id: "recommendationsEngine",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as RoutingEngineContext,
    states: {
      subscribing: {
        entry: ["setContext", "clearLookups", "setBasketHelper", "getBasket"],
      },

      error: {},
      // ---
      complete: {
        type: "final",
      },
    },
    on: {
      STOP: {
        target: "complete",
      },
    },
  },
  {
    actions: {},

    guards: {},

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    services,
  }
);
