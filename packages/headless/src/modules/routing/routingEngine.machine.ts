// --- external
import { createMachine, assign, send } from "xstate";

// --- internal
import services from "./services";
import { useI18n } from "../system";

// --- utils
import {
  DetailedError,
  responseCodes,
  useTime,
  ErrorOrigin,
  mapToHeadlessError
} from "../../utils";
import { first, has, isEmpty, isEqual, keys, reduce, some } from "lodash-es";

// --- types
import type { AnyEventObject } from "xstate";
import type { FunnelProps, Funnels, RoutingEngineContext } from "./types";
import { type RouteLocation } from "vue-router";
import { useQueryParams } from "./useQueryParams";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    id: "routingEngine",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as RoutingEngineContext,
    states: {
      subscribing: {
        // await registration of flows ( if not already in context )
        // if we have no flows in context, we cannot do anything
        // but we can still be given flows to process and restart
        always: {
          target: "available",
          cond: "hasFunnels"
        }
      },

      available: {
        initial: "loading",
        states: {
          loading: {
            entry: "clearError",
            invoke: {
              id: "prepareActiveMachine",
              src: "prepare",

              // The service successfully returns the executable machine instance
              onDone: {
                target: "guiding",
                actions: "setFunnel"
              },
              onError: {
                // If factory fails (e.g., config error), restart and try subscribing the default
                target: "idle",
                actions: ["clearFunnel", "setError"]
              }
            }
          },
          /**
           * State: Idle state when no funnel is active. Awaits further instructions to load a funnel.
           */
          idle: {},
          /**
           * State: Invokes the selected funnel machine and forwards all navigation events.
           * This is the heart of the routing logic.
           */
          guiding: {
            entry: "clearTargetRoute",
            // Invokes the machine instance prepared in the previous state
            invoke: {
              id: "currentFunnel",
              src: ({ funnel }: RoutingEngineContext) => {
                const { t } = useI18n();
                if (!funnel) {
                  throw new DetailedError(
                    t("error.funnels_not_available"),
                    responseCodes.Service_Unavailable,
                    ErrorOrigin.Headless
                  );
                  // Or return a fallback machine if you have one
                }
                return funnel;
              },
              autoForward: true,
              // 🎯 Funnel Completion (Chaining/Fallback)
              onDone: {
                target: "loading", // Return to selection state to load the next funnel
                actions: ["resetFunnel"]
              },
              onError: { target: "idle" }
            }
          }
        }
      },

      error: {},

      // ---

      // Handle completion, stop the machine and prevent further requests
      complete: {
        type: "final"
      }
    },
    on: {
      // Event: Manual override to switch to a different funnel (Pattern B)
      SWITCH: {
        target: "available",
        actions: "switchFunnel",
        cond: "hasValidFunnel"
      },

      // Capture resolution requests at any time and pass them to the current funnel
      RESOLVE: {
        actions: ["setTargetRoute"]
      },

      REGISTER: {
        target: "available",
        actions: ["clearError", "setFunnels"]
      },
      STOP: {
        target: "complete"
      }
    }
  },
  {
    actions: {
      setTargetRoute: assign({
        targetRoute: (
          _context: RoutingEngineContext,
          { data }: AnyEventObject
        ) => {
          return data?.target || data?.route;
        }
      }),
      /**
       * Action to process the initial REGISTER event, setting up the dynamic default ID
       * and the master list of all funnels.
       */
      setFunnels: assign(
        (
          { funnels, defaultFunnel }: RoutingEngineContext,
          { data }: AnyEventObject
        ) => {
          //  extract data
          const newFunnelsArray = data?.funnels || [];
          const newDefaultFunnel = data?.defaultFunnel;
          const newWatchers = data?.watchers;
          const newOverlays = data?.overlays;

          // Convert newFunnelsArray to a dictionary, merging with existing if id matches
          const funnelDictionary = reduce(
            newFunnelsArray,
            (acc: Funnels, config: FunnelProps) => {
              if (acc[config.id]) {
                // Merge existing funnel config with new one
                acc[config.id] = { ...acc[config.id], ...config };
              } else {
                acc[config.id] = config;
              }
              return acc;
            },
            funnels || {}
          );

          // Fallback logic for the default ID
          const newDefaultId =
            newDefaultFunnel ||
            defaultFunnel ||
            first(keys(funnelDictionary)) ||
            undefined;

          return {
            funnels: funnelDictionary,
            defaultFunnel: newDefaultId,
            currentFunnel: newDefaultId, // Start with the default funnel active
            overlays: newOverlays,
            watchers: newWatchers
          };
        }
      ),

      /**
       * Action to switch to a different funnel based on route query parameters.
       * This action shold be guarded to ensure the requested funnel exists and is valid.
       */
      switchFunnel: assign({
        currentFunnel: (
          { currentFunnel }: RoutingEngineContext,
          { data }: AnyEventObject
        ) => {
          const currentRoute: RouteLocation = data?.route;
          const funnel = currentRoute.query?.funnel as string;
          return funnel || currentFunnel;
        }
      }),

      setFunnel: assign(
        (_context: RoutingEngineContext, { data }: AnyEventObject) => ({
          currentFunnel: data.funnel,
          funnel: data // This should be a StateMachine instance
        })
      ),

      /**
       * Action to handle funnel completion (onDone). It checks for chaining logic.
       * This is the core of Pattern C (Chaining) and Pattern D (Fallback).
       */
      resetFunnel: assign(
        ({ defaultFunnel }: RoutingEngineContext, { data }: AnyEventObject) => {
          // Data is returned from the child's final state: { targetRoute, funnel }
          // Determine the next funnel: prioritize the child's request, otherwise use the configured default
          return {
            currentFunnel: undefined,
            defaultFunnel: data?.funnel || defaultFunnel,
            targetRoute: data?.targetRoute
          };
        }
      ),

      clearFunnel: assign({
        currentFunnel: undefined
      }),

      setError: assign({
        error: (_context: RoutingEngineContext, { data }: AnyEventObject) =>
          mapToHeadlessError(data)
      }),

      clearError: assign({ error: undefined }),

      clearTargetRoute: assign({
        targetRoute: (_context: RoutingEngineContext) => undefined
      })
    },

    guards: {
      hasFunnels: ({ funnels }: RoutingEngineContext) => !isEmpty(funnels),
      hasValidFunnel: (
        { funnels, currentFunnel }: RoutingEngineContext,
        { data }: AnyEventObject
      ) => {
        //
        const { getParam } = useQueryParams(data?.route);
        // The data fro mthe event may contain a route OR a named funnel directly
        const funnel = getParam("funnel", data?.funnel) as string;
        const valid =
          !!funnel && !isEqual(funnel, currentFunnel) && has(funnels, funnel);
        return valid;
      }
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services
  }
);
