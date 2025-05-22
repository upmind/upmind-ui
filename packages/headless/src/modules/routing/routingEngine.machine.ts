// --- external
import { createMachine, assign, spawn, actions, sendTo, pure } from "xstate";

// --- internal
import services from "./services";
import { basketSubscription } from "../basketProduct/helper";

// --- utils
import { useTime } from "../../utils";
import { defaultsDeep, find, get, isEmpty, uniqBy } from "lodash-es";

// --- types
import type { AnyEventObject } from "xstate";
import type { RoutingEngineContext } from "./types";

// -----------------------------------------------------------------------------
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
          "loadBasket",
          assign({ currentFlow: undefined, currentRoute: undefined }),
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
          ERROR: {
            target: "unavailable",
          },
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
                target: "#resolved",
                actions: "setResolved",
              },
              onError: {
                target: "#resolved",
                actions: "setResolved",
              },
            },
          },
          back: {
            invoke: {
              src: "calculateBackRoute",
              onDone: {
                target: "#resolved",
                actions: "setResolved",
              },
              onError: {
                target: "#resolved",
                actions: "setResolved",
              },
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
            actions: "setResolved",
          },
          onError: {
            target: "resolved",
            actions: "setResolved",
          },
        },
        on: {
          NEXT: {
            target: "calculating.next",
          },
          BACK: {
            target: "calculating.back",
          },
        },
      },

      resolved: {
        id: "resolved",
        after: {
          wait: "available",
        },
      },

      // ---
      complete: {},
    },
    on: {
      REFRESH: [
        {
          actions: ["setBasket"],
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
          return uniqBy([...(data ?? []), ...flows], "name");
        },
      }),

      setResolved: assign({
        currentFlow: ({ flows }, { data }: AnyEventObject) => {
          const flow = get(data, "flow", data);
          const registerdFlow = find(flows, ["name", flow?.name]);
          // ensure we keep all the defaults from the registered flow, so we dont haveto repeat ourselves
          const value = defaultsDeep(flow, registerdFlow);
          return value;
        },
        currentRoute: (_context, { data }: AnyEventObject) => {
          const route = get(data, "route", data);
          return route;
        },
      }),

      // ---
      setBasketHelper: assign({
        basketHelper: ({ basketHelper }) => {
          return basketHelper ?? spawn(basketSubscription);
        },
      }),

      loadBasket: pure(({ basketHelper }: RoutingEngineContext, _event) => {
        if (!basketHelper) return;
        return sendTo(basketHelper, {
          type: "INIT",
        });
      }),
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
