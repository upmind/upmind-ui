// --- external
import { createMachine, assign, spawn, actions } from "xstate";
const { sendTo } = actions;

// --- internal
import services from "./services";
import { basketSubscription } from "../basket/helper";

// --- utils
import { useTime } from "../../utils";
import { defaultsDeep, find, get, isEmpty, isFunction } from "lodash-es";

// --- types
import type { AnyEventObject } from "xstate";
import { ROUTE } from "./types";
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
        entry: [
          "setContext",
          "setBasketHelper",
          "getBasket",
          assign({ currentFlow: undefined }),
        ],
        on: {
          // when we get our basket, then we can start and determine the first route (if any)
          // otherwise we are not available
          REFRESH: [
            {
              target: "unavailable",
              actions: ["setBasket"],
              cond: "hasNoFlows",
            },
            { target: "processing", actions: ["setBasket"] },
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
          auth: {
            initial: "register",
            states: {
              login: {},
              register: {},
              forgot: {},
              profile: {},
            },
          },
          cart: {},
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
            target: "processing.next",
          },
          BACK: {
            target: "processing.back",
          },
          NAVIGATE: {
            target: "processing.navigate",
          },
        },
      },

      unavailable: {
        // if we have no flows in context, we can not do anything
        // but we can still be given flows to process and restart
        on: {
          SET: {
            target: "available",
            actions: ["setFlows"],
          },
        },
      },

      // ---
      // This is where we calculate the next/back/fallback state and then navigate to it
      processing: {
        id: "processing",
        initial: "next",
        states: {
          next: {
            invoke: {
              src: "calculateNextRoute",
              onDone: "navigate",
              onError: "fallback",
            },
          },
          back: {
            invoke: {
              src: "calculateBackRoute",
              onDone: "navigate",
              onError: "fallback",
            },
          },
          fallback: {
            invoke: {
              src: "calculateFallbackRoute",
              onDone: "navigate",
              onError: "navigate",
            },
          },
          navigate: {
            always: [
              {
                target: "#available.empty",
                actions: assign({
                  currentFlow: ({ flows }) => find(flows, { id: ROUTE.EMPTY }),
                }),
                cond: (_, event: AnyEventObject) =>
                  (event.data as Flow)?.id == ROUTE.EMPTY,
              },
              {
                target: "#available.product.add",
                actions: assign({
                  currentFlow: ({ flows }) =>
                    find(flows, { id: ROUTE.PRODUCT_ADD }),
                }),
                cond: (_, event: AnyEventObject) =>
                  (event.data as Flow)?.id == ROUTE.PRODUCT_ADD,
              },
              {
                target: "#available.product.edit",
                actions: assign({
                  currentFlow: ({ flows }) =>
                    find(flows, { id: ROUTE.PRODUCT_EDIT }),
                }),
                cond: (_, event: AnyEventObject) =>
                  (event.data as Flow)?.id == ROUTE.PRODUCT_EDIT,
              },
              {
                target: "#available.product.requiresAction",
                actions: assign({
                  currentFlow: ({ flows }) =>
                    find(flows, { id: ROUTE.PRODUCT_REQUIRES_ACTION }),
                }),
                cond: (_, event: AnyEventObject) =>
                  (event.data as Flow)?.id == ROUTE.PRODUCT_REQUIRES_ACTION,
              },
              {
                target: "#available.recommendations",
                actions: assign({
                  currentFlow: ({ flows }) =>
                    find(flows, { id: ROUTE.RECOMMENDATIONS }),
                }),
                cond: (_, event: AnyEventObject) =>
                  (event.data as Flow)?.id == ROUTE.RECOMMENDATIONS,
              },
              {
                target: "#available.auth.login",
                actions: assign({
                  currentFlow: ({ flows }) => find(flows, { id: ROUTE.LOGIN }),
                }),
                cond: (_, event: AnyEventObject) =>
                  (event.data as Flow)?.id == ROUTE.LOGIN,
              },
              {
                target: "#available.auth.register",
                actions: assign({
                  currentFlow: ({ flows }) =>
                    find(flows, { id: ROUTE.REGISTER }),
                }),
                cond: (_, event: AnyEventObject) =>
                  (event.data as Flow)?.id == ROUTE.REGISTER,
              },
              {
                target: "#available.auth.forgot",
                actions: assign({
                  currentFlow: ({ flows }) =>
                    find(flows, { id: ROUTE.FORGOT_PASSWORD }),
                }),
                cond: (_, event: AnyEventObject) =>
                  (event.data as Flow)?.id == ROUTE.FORGOT_PASSWORD,
              },
              {
                target: "#available.cart",
                actions: assign({
                  currentFlow: ({ flows }) => find(flows, { id: ROUTE.CART }),
                }),
                cond: (_, event: AnyEventObject) =>
                  (event.data as Flow)?.id == ROUTE.CART,
              },
              {
                target: "#available.checkout",
                actions: assign({
                  currentFlow: ({ flows }) =>
                    find(flows, { id: ROUTE.CHECKOUT }),
                }),
                cond: (_, event: AnyEventObject) =>
                  (event.data as Flow)?.id == ROUTE.CHECKOUT,
              },
              {
                target: "#available.order",
                actions: assign({
                  currentFlow: ({ flows }) => find(flows, { id: ROUTE.ORDER }),
                }),
                cond: (_, event: AnyEventObject) =>
                  (event.data as Flow)?.id == ROUTE.ORDER,
              },
              // fallback
              {
                target: "#available.cart",
                actions: assign({
                  currentFlow: ({ flows }) => find(flows, { id: ROUTE.CART }),
                }),
              },
            ],
            exit: ["handleRoute"],
          },
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
          actions: ["processing"],
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
          return basket.id;
        },
      }),

      setFlows: assign({
        flows: (_context, { data }: AnyEventObject) => {
          const flows = get(data, "flows", data);
          return flows;
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

      handleRoute: (_context, event: AnyEventObject, meta: any) => {
        const flow = event?.data as Flow;
        console.log("handleRoute", flow, meta);

        if (isFunction(flow.handler)) flow.handler(_context, event);

        // MAYBE we need to accomodate ignoring the handler if the route is already the current route
        // or do we leave that to the router or handler to decide?
      },
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
