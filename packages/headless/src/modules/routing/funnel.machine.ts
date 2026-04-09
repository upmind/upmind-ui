// --- external
import { type AnyEventObject, assign, createMachine, sendParent } from "xstate";

// --- internal
import { useI18n } from "../system";

// --- utils
import { DetailedError, responseCodes, ErrorOrigin } from "../../utils";
import {
  forEach,
  isEmpty,
  includes,
  isString,
  keys,
  map,
  mapValues,
  reduce,
  some
} from "lodash-es";
import { pascalCase } from "./utils";

// --- types
import {
  type FunnelContext,
  type FunnelProps,
  type FunnelStateMeta
} from "./types";

/**
 * Minimal shape of a state node config used by the meta enrichment.
 * Avoids `any` while keeping compatibility with XState's StateNodeConfig.
 */
type StateNodeShape = {
  meta?: FunnelStateMeta;
  on?: Record<string, unknown>;
  [key: string]: unknown;
};

// -----------------------------------------------------------------------------

/**
 * Creates a standardized funnel machine instance with dynamic states, guards, and services injected.
 * This function acts as the Dependency Injector for the funnel architecture.
 * @param {FunnelProps} params - The configuration parameters for the funnel machine.
 * @param {string} params.id - The unique identifier for the funnel machine.
 * @param {Record<string, import('xstate').StateNodeConfig<any, any, any>>} params.states - The states of the funnel machine.
 * @param {Record<string, import('xstate').GuardPredicate<any, any>>} [params.guards={}] - The guard conditions for state transitions.
 * @param {Record<string, import('xstate').ServiceConfig<any, any>>} [params.services={}] - The services (invoked actors) for the funnel machine.
 * @param {Record<string, import('xstate').ActionFunction<any, any>>} [params.actions={}] - The actions to be executed on state transitions.
 * @param {any} [params.context={}] - The initial context for the funnel machine.
 * @returns {import('xstate').StateMachine} An executable XState machine instance.
 */
export const useFunnelMachine = ({
  id,
  states,
  context = {},
  guards = {},
  services = {},
  actions = {}
}: FunnelProps) => {
  // --- FE-2583: Auto-generate NEXT/BACK handlers from state meta
  // States declaring meta.next / meta.prev get auto-wired handlers.
  // Explicit `on.NEXT` / `on.BACK` in the state config take precedence.
  const enrichedStates = mapValues(states, (config: StateNodeShape) => {
    const meta = config.meta as FunnelStateMeta | undefined;
    if (!meta) return config;

    const metaHandlers: Record<string, unknown> = {};

    if (meta.next) {
      metaHandlers.NEXT = {
        target: meta.next,
        actions: [assign({ targetRoute: { name: meta.next } })]
      };
    }
    if (meta.prev) {
      metaHandlers.BACK = {
        target: meta.prev,
        actions: [assign({ targetRoute: { name: meta.prev } })]
      };
    }

    if (isEmpty(metaHandlers)) return config;

    return {
      ...config,
      on: {
        ...metaHandlers, // Meta-derived handlers (defaults)
        ...config.on // Explicit handlers override meta
      }
    };
  });
  return createMachine(
    {
      id: `${id}Funnel`,
      predictableActionArguments: true,
      context,
      initial: "loading",
      states: {
        // 1. Loading State to validate the funnel configuration to ensure we have states before proceeding
        loading: {
          invoke: {
            src: async (_context, _event) => {
              const { t } = useI18n();
              if (isEmpty(states)) {
                throw new DetailedError(
                  t("error.funnel_not_available"),
                  responseCodes.Service_Unavailable,
                  ErrorOrigin.Headless
                );
              }
            },
            onDone: [
              ...keys(states).map(state => {
                return {
                  target: `available.${state}`,
                  actions: ["setResolving"],
                  cond: `is${pascalCase(state)}`
                };
              }),
              // If we are not targeting a specific state, go to idle and assume we are resolved
              { target: "available", cond: "noTarget" },
              { target: "available", actions: ["setResolved"] }
            ],
            onError: {
              target: "unavailable"
            }
          }
        },

        // 2. The main AVAILABLE state that contains the dynamic funnel states
        available: {
          initial: "idle",

          // FE-2546: Invoke watcher subscriptions as an invoked callback.
          // Watchers subscribe to reactive sources (session, basket) and trigger
          // navigation through the funnel pipeline. Cleanup runs on state exit.
          invoke: {
            id: "watcherSubscription",
            src: "watcherSubscription"
          },

          // 🎯 INJECTION POINT: The dynamic nodes are spread into the AVAILABLE states
          states: {
            // --- A fallback UNKNOWN state to catch any undefined routes
            idle: {},
            ...enrichedStates
          },
          // 3. Global Event Handlers for the entire funnel (Optional, usually handled by nodes)
          on: {
            // These events are forwarded from the Parent Routing Engine
            NEXT: {
              actions: ["setResolving"]
            },
            BACK: {
              actions: ["setResolving"]
            },
            // Pre-lock: immediately mark as unresolved to prevent watcher races (FE-2587)
            PRE_RESOLVE: {
              actions: ["setUnresolved"]
            },
            // Generic RESOLVE event to transition to a specific state within the Available funnel
            RESOLVE: [
              ...keys(states).map(state => {
                return {
                  target: `available.${state}`,
                  actions: [
                    "setResolving",
                    "setCurrentRoute",
                    "setTargetRoute"
                  ],
                  cond: `is${pascalCase(state)}`
                };
              }),
              {
                target: "available.idle",
                actions: [
                  "setFallbackResolved",
                  "setCurrentRoute",
                  "setTargetRoute"
                ]
              }
            ]
          }
        },

        // 3. Error State if the funnel is misconfigured or fails to load
        unavailable: {
          type: "final"
        },
        /**
         * 🎯 ROUTE COMPLETE
         * This is the FINAL state that handles any unhandled routes.
         * It is designed to gracefully shut down this funnel and reload the default/next funnel
         * We can optionally pass a funnel identifier to the parent routing engine to switch funnels.
         * We can optionally pass the targetRoute to the parent routing engine to continue navigation to a desired route.
         */
        complete: {
          id: "complete",
          type: "final",
          data: (context: FunnelContext, _event: AnyEventObject) => {
            return { funnel: undefined, ...context };
          }
        }
      }
    },
    {
      // 4. Options Injection: Wiring up the logic implementations
      // These options map string names used in states
      guards: {
        ...reduce(
          states,
          (acc, _value, state) => {
            acc[`is${pascalCase(state)}`] = (
              { targetRoute }: FunnelContext,
              { data }: AnyEventObject
            ) => {
              const target =
                (isString(data?.target)
                  ? { name: data.target }
                  : data?.target) ?? targetRoute;

              return target?.name == state;
            };
            return acc;
          },
          {} as Record<
            string,
            (context: FunnelContext, event: AnyEventObject) => boolean
          >
        ),

        isUnsupportedRoute: (
          { currentRoute, targetRoute }: FunnelContext,
          _event: AnyEventObject
        ) => {
          const supportedTarget = includes(keys(states), currentRoute?.name);
          return !supportedTarget && !isEmpty(targetRoute);
        },

        noTarget: (
          { targetRoute }: FunnelContext,
          { data }: AnyEventObject
        ) => {
          const target =
            (isString(data?.target) ? { name: data.target } : data?.target) ??
            targetRoute;

          const exists = some(keys(states), state => state == target?.name);
          return isEmpty(target) || !exists;
        },

        isNext: ({ resolved }: FunnelContext, { data }: AnyEventObject) =>
          data?.type === "NEXT" && !resolved,

        isBack: ({ resolved }: FunnelContext, { data }: AnyEventObject) =>
          data?.type === "BACK" && !resolved,

        // Consumer guards spread last so they can override auto-generated
        // `is{State}` guards. If a consumer defines a guard with the same name
        // as an auto-generated one, the consumer's version takes precedence.
        ...guards
      },
      services: {
        /**
         * FE-2546: Invoked callback that subscribes to all registered watchers.
         * Each watcher is self-contained — it sets up its own reactive subscription
         * and handles navigation internally.
         * The funnel machine just starts/stops them when entering/exiting available.
         */
        watcherSubscription:
          ({ watchers }: FunnelContext) =>
          () => {
            if (!watchers || isEmpty(watchers)) return () => {};

            // Start all watchers — each returns its own cleanup function
            const cleanups = map(watchers, watcher => {
              try {
                return watcher.handler();
              } catch (error) {
                console.error(
                  `[funnel] Watcher "${watcher.id}" failed to initialize:`,
                  error
                );
                return () => {};
              }
            });

            // Return cleanup function — called when funnel exits available
            return () => {
              forEach(cleanups, (cleanup: () => void) => {
                try {
                  cleanup();
                } catch (error) {
                  console.error("[funnel] Watcher cleanup failed:", error);
                }
              });
            };
          },
        ...services
      },
      actions: {
        setCurrentRoute: assign({
          currentRoute: (
            { targetRoute }: FunnelContext,
            { data }: AnyEventObject
          ) => data?.route ?? targetRoute
        }),

        setTargetRoute: assign({
          targetRoute: (
            { targetRoute }: FunnelContext,
            { data }: AnyEventObject
          ) => {
            const target = isString(data?.target)
              ? { name: data.target }
              : data?.target;

            return target ?? targetRoute;
          }
        }),

        clearTargetRoute: assign({
          targetRoute: undefined
        }),

        sendResolved: sendParent(
          ({ targetRoute }: FunnelContext, { data }: AnyEventObject) => {
            const target = isString(data?.target)
              ? { name: data.target }
              : (data?.target ?? targetRoute);

            return {
              type: "RESOLVED",
              data: { target }
            };
          }
        ),

        setResolved: assign({
          targetRoute: (
            { targetRoute }: FunnelContext,
            { data }: AnyEventObject
          ) => {
            const target = isString(data?.target)
              ? { name: data.target }
              : data?.target;

            return target ?? targetRoute;
          },
          resolved: true
        }),

        /**
         * @deprecated Use setUnresolved + clearTarget separately.
         * Sets resolved: false AND clears targetRoute.
         */
        setResolving: assign({
          resolved: false,
          targetRoute: undefined,
          fallbackResolved: false
        }),

        /** Only sets resolved: false — preserves targetRoute. */
        setUnresolved: assign({
          resolved: false
        }),

        /** Only clears targetRoute — preserves resolved state. */
        clearTarget: assign({
          targetRoute: undefined
        }),

        /** Sets resolved + marks as fallback (no state matched). Logs dev warning. */
        setFallbackResolved: assign({
          targetRoute: (
            { targetRoute }: FunnelContext,
            { data }: AnyEventObject
          ) => {
            const target = isString(data?.target)
              ? { name: data.target }
              : data?.target;

            if (import.meta.env.DEV) {
              const routeName = (target ?? targetRoute)?.name ?? "unknown";
              console.warn(
                `[funnel] Route "${String(routeName)}" fell through to idle — no state matched. Check your funnel config.`
              );
            }

            return target ?? targetRoute;
          },
          resolved: true,
          fallbackResolved: true
        }),

        // Consumer actions spread last so they can override defaults
        ...actions
      }
    }
  );
};
