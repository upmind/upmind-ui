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

// ---
const routeConditions = [
  {
    target: "#available.empty",
    actions: "setCurrentFlow",
    cond: (_: RoutingEngineContext, event: any) => {
      return (event.data as Flow)?.id == ROUTE.EMPTY;
    },
  },
  {
    target: "#available.product.add",
    actions: "setCurrentFlow",
    cond: (_: RoutingEngineContext, event: AnyEventObject) =>
      (event.data as Flow)?.id == ROUTE.PRODUCT_ADD,
  },
  {
    target: "#available.product.edit",
    actions: "setCurrentFlow",
    cond: (_: RoutingEngineContext, event: AnyEventObject) =>
      (event.data as Flow)?.id == ROUTE.PRODUCT_EDIT,
  },
  {
    target: "#available.product.requiresAction",
    actions: "setCurrentFlow",
    cond: (_: RoutingEngineContext, event: AnyEventObject) =>
      (event.data as Flow)?.id == ROUTE.PRODUCT_REQUIRES_ACTION,
  },
  {
    target: "#available.recommendations",
    actions: "setCurrentFlow",
    cond: (_: RoutingEngineContext, event: AnyEventObject) =>
      (event.data as Flow)?.id == ROUTE.RECOMMENDATIONS,
  },
  {
    target: "#available.session.login",
    actions: "setCurrentFlow",
    cond: (_: RoutingEngineContext, event: AnyEventObject) =>
      (event.data as Flow)?.id == ROUTE.LOGIN,
  },
  {
    target: "#available.session.register",
    actions: "setCurrentFlow",
    cond: (_: RoutingEngineContext, event: AnyEventObject) =>
      (event.data as Flow)?.id == ROUTE.REGISTER,
  },
  {
    target: "#available.session.forgot",
    actions: "setCurrentFlow",
    cond: (_: RoutingEngineContext, event: AnyEventObject) =>
      (event.data as Flow)?.id == ROUTE.FORGOT_PASSWORD,
  },
  {
    target: "#available.basket",
    actions: "setCurrentFlow",
    cond: (_: RoutingEngineContext, event: AnyEventObject) =>
      (event.data as Flow)?.id == ROUTE.BASKET,
  },
  {
    target: "#available.checkout",
    actions: "setCurrentFlow",
    cond: (_: RoutingEngineContext, event: AnyEventObject) =>
      (event.data as Flow)?.id == ROUTE.CHECKOUT,
  },
  {
    target: "#available.order",
    actions: "setCurrentFlow",
    cond: (_: RoutingEngineContext, event: AnyEventObject) =>
      (event.data as Flow)?.id == ROUTE.ORDER,
  },
  // fallback
  {
    target: "#available.basket",
    actions: assign({
      currentFlow: ({ flows }: RoutingEngineContext) =>
        find(flows, { id: ROUTE.BASKET }),
    }),
  },
];
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
        id: "available",
        initial: "idle",
        states: {
          idle: {
            entry: [assign({ currentFlow: undefined })],
          },
          empty: {
            entry: [
              assign({
                currentFlow: ({ flows }) => find(flows, { id: ROUTE.EMPTY }),
              }),
            ],
          },
          product: {
            initial: "notFound",
            states: {
              notFound: {},
              add: {},
              edit: {},
              requiresAction: {},
            },
          },
          recommendations: {},
          session: {
            initial: "register",
            states: {
              login: {},
              register: {},
              forgot: {},
              profile: {},
            },
          },
          basket: {},
          checkout: {},
          order: {
            initial: "loading",
            states: {
              loading: {},
              success: {},
              failed: {},
            },
          },
        },
        on: {
          NEXT: {
            target: "calculating.next",
          },
          BACK: {
            target: "calculating.back",
          },
          NAVIGATE: {
            target: "navigating",
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
      // This is where we calculate the next/back/fallback state and then navigate to it
      calculating: {
        id: "calculating",
        initial: "next",
        states: {
          next: {
            invoke: {
              src: "calculateNextRoute",
              onDone: {
                target: "#navigating",
                actions: "setCurrentFlow",
              },
              onError: "#navigating",
            },
          },
          back: {
            invoke: {
              src: "calculateBackRoute",
              onDone: {
                target: "#navigating",
                actions: "setCurrentFlow",
              },
              onError: "#navigating",
            },
          },
        },
      },

      navigating: {
        id: "navigating",
        invoke: {
          src: "handleRoute",
          onDone: routeConditions,
          onError: routeConditions,
        },
      },

      // ---
      complete: {
        type: "final",
      },
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
          return uniqBy([...(data || []), ...flows], "id");
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
