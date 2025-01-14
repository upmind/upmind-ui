// --- external
import { createMachine, assign, spawn, actions } from "xstate";
const { sendTo } = actions;

// --- internal
import services from "./services";
import { basketSubscription } from "../basket/helper";

// --- utils
import { useTime } from "../../utils";
import {
  defaultsDeep,
  find,
  get,
  isEmpty,
  isFunction,
  uniqBy,
} from "lodash-es";

// --- types
import type { AnyEventObject } from "xstate";
import { ROUTE } from "./types";
import type { RoutingEngineContext, Flow } from "./types";

// --------------------------------------------------------

export default createMachine(
  {
    id: "routingEngine",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as RoutingEngineContext,
    states: {
      subscribing: {
        entry: [
          "setContext",
          "setBasketHelper",
          "getBasket",
          assign({ currentFlow: undefined }),
        ],
        on: {
          REGISTER: {
            actions: ["setFlows"],
          },
          // when we get our basket, then we can start and determine the first route (if any)
          // otherwise we are not available
          REFRESH: [
            {
              target: "unavailable",
              actions: ["setBasket"],
              cond: "hasNoFlows",
            },
            { target: "available", actions: ["setBasket"] },
          ],
        },
      },

      // ---
      available: {
        on: {
          NEXT: {
            target: "calculating.next",
          },
          BACK: {
            target: "calculating.back",
          },
          RESOLVE: {
            target: "resolving",
          },
          REGISTER: {
            target: "available",
            actions: ["setFlows"],
          },
        },
      },

      unavailable: {
        // if we have no flows in context, we can not do anything
        // but we can still be given flows to process and restart
        on: {
          REGISTER: {
            target: "available",
            actions: ["setFlows"],
          },
        },
      },

      // ---
      // This is where we calculate the next/back/fallback state and then RESOLVE to it
      calculating: {
        id: "calculating",
        initial: "next",
        states: {
          next: {
            invoke: {
              src: "calculateNextRoute",
              onDone: {
                target: "#resolving",
                actions: "setCurrentFlow",
              },
              onError: "#resolving",
            },
          },
          back: {
            invoke: {
              src: "calculateBackRoute",
              onDone: {
                target: "#resolving",
                actions: "setCurrentFlow",
              },
              onError: "#resolving",
            },
          },
        },
      },

      resolving: {
        id: "resolving",
        invoke: {
          src: "resolve",
          onDone: {
            target: "resolved",
            actions: "setCurrentFlow",
          },
          onError: {
            target: "resolved",
            actions: "setCurrentFlow",
          },
        },
      },

      resolved: {
        after: {
          WAIT: "available",
        },
      },

      // ---
      complete: {},
    },
    on: {
      REFRESH: [
        {
          actions: ["calculating"],
          cond: "hasBasketChanged",
        },
        { actions: ["setBasket"] },
      ],
      STOP: {
        target: "complete",
      },
    },
  },
  {
    actions: {
      setContext: assign((context, _event) =>
        defaultsDeep(context, {
          flows: [],
          // ---
          error: undefined,
          // ---
          basketId: undefined,
          basketHelper: undefined,
        })
      ),

      setBasket: assign({
        basketId: (_context, { data }: AnyEventObject) => {
          const basket = get(data, "basket", data);
          return basket?.id;
        },
      }),

      setFlows: assign({
        flows: ({ flows }, { data }: AnyEventObject) => {
          return uniqBy([...(data || []), ...flows], "name");
        },
      }),

      setCurrentFlow: assign({
        currentFlow: (_context, { data }: AnyEventObject) => {
          const flow = get(data, "flow", data);
          return flow;
        },
      }),

      // ---
      setBasketHelper: assign({
        basketHelper: ({ basketHelper }) => {
          return basketHelper ?? spawn(basketSubscription);
        },
      }),

      getBasket: sendTo(
        ({ basketHelper }: any, _event) => basketHelper,
        (context, _event) => ({
          type: "INIT",
          context,
        })
      ),
    },

    guards: {
      hasBasketChanged: (
        { basketId }: RoutingEngineContext,
        { data }: AnyEventObject
      ) => {
        //  NB: data is raw basket data so use snake_case for comparison
        const basketChanged = basketId !== data?.id;
        const value = basketChanged;
        return value;
      },

      hasNoFlows: context => isEmpty(context.flows),
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    services,
  }
);
