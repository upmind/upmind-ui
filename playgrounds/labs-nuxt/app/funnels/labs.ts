import {
  assign,
  type FunnelContext,
  type FunnelProps,
  QUERY_PARAMS,
  SESSION_FORMS
} from "@upmind-automation/client-vue";
import { scenarioRoutes } from "../../modules/scenarios/runtime/registry";
import actions from "./engine/actions";
import guards from "./engine/guards";
import services from "./engine/services";
import { ROUTE } from "./types";
import { mapValues, toString } from "lodash-es";

// -----------------------------------------------------------------------------

/** The overlay suffix `registerOverlayRoutes` injects the auth modal under. */
const AUTH_OVERLAY_ID = "auth";

/**
 * 🎯 EVERY SCENARIO ROUTE
 * One guarded state per registered scenario — the route name IS the state name,
 * so `is{Route}` matches it and the funnel can gate what the registry declares
 * without a hand-listed state. `guardScenario` rejects toward SESSION when the
 * scope the url names needs a session the visitor does not have; the auth modal
 * is then collected IN PLACE by re-targeting the route to its own `--auth`
 * child, which resolves through the generated `endpoint:auth` node and renders
 * over the page. Dismissing it lands on HOME.
 */
const scenarioStates = mapValues(scenarioRoutes, () => ({
  invoke: {
    src: "guardScenario",
    onDone: { actions: ["setResolved"] },
    onError: [
      {
        target: ROUTE.SESSION_LOGIN,
        actions: [
          "setUnresolved",
          assign({
            targetRoute: ({ currentRoute }: FunnelContext) => ({
              name: `${toString(currentRoute?.name)}--${AUTH_OVERLAY_ID}`,
              params: currentRoute?.params,
              query: {
                mode: SESSION_FORMS.LOGIN,
                [QUERY_PARAMS.CANCEL_URL]: ROUTE.HOME
              }
            })
          })
        ],
        cond: "isSession"
      },
      { actions: ["setResolved"] }
    ]
  }
}));

export default <FunnelProps>{
  id: "labs",
  states: {
    ...scenarioStates,

    /**
     * 🎯 idle (override)
     * This is the idle state of the funnel, which acts as a catch-all for unsupported routes.
     * If the current route is not one of the supported routes for this funnel,
     * and there is a meaningful target route set, it transitions to the 'complete' state
     * to allow the default funnel to take over the navigation.
     */
    idle: {
      entry: ["setResolved"]
    },

    /**
     * 🎯 ROUTE.SESSION
     * This state serves as a routing hub for session-related actions.
     * It always transitions to the SESSION_REGISTER route to handle user registration as the default action.
     */
    [ROUTE.SESSION]: {
      invoke: {
        src: "guardSession",
        onDone: {
          actions: ["setResolved"]
        },
        onError: {
          target: ROUTE.SESSION_REGISTER,
          actions: ["setResolving"]
        }
        // BRAND SETTING TO DECIDE DEFAULT SESSION ROUTE
      }
    },

    /**
     * 🎯 ROUTE.SESSION_LOGIN
     * This state manages the login process for user sessions.
     * It invokes a 'guard' to check if the user is authenticated.
     * If the user is authenticated, it redirects to the BASKET route.
     * From here, users can proceed to the CHECKOUT route or return to the BASKET.
     */
    [ROUTE.SESSION_LOGIN]: {
      entry: ["setCurrency"],
      invoke: {
        src: "guardSession",
        onDone: {
          actions: ["setResolved"]
        },
        onError: { actions: ["setResolved"] }
      },
      on: {
        NEXT: {
          target: ROUTE.SESSION_LOGIN,
          actions: ["setResolving", "setTargetRoute"]
        },
        BACK: { actions: ["setResolving", "setTargetRoute"] }
      }
    },

    /**
     * 🎯 ROUTE.SESSION_REGISTER
     * This state manages the registration process for new user sessions.
     * It invokes a 'guard' to check if the user is authenticated.
     * If the user is authenticated, it redirects to the BASKET route.
     * From here, users can proceed to the CHECKOUT route or return to the BASKET.
     */
    [ROUTE.SESSION_REGISTER]: {
      invoke: {
        src: "guardSession",
        onDone: {
          actions: ["setResolved"]
        },
        onError: { actions: ["setResolved"] }
      },
      on: {
        NEXT: {
          target: ROUTE.SESSION_REGISTER,
          actions: ["setResolving", "setTargetRoute"]
        },
        BACK: { actions: ["setResolving", "setTargetRoute"] }
      }
    },

    /**
     * 🎯 ROUTE.SESSION_RECOVER_PASSWORD
     * This state manages the password recovery process for user sessions.
     */
    [ROUTE.SESSION_RECOVER_PASSWORD]: {
      invoke: {
        src: "guardSession",
        onDone: {
          actions: ["setResolved"]
        },
        onError: [{ actions: ["setResolved"] }]
      },
      on: {
        NEXT: {
          target: ROUTE.SESSION_RECOVER_PASSWORD,
          actions: ["setResolving", "setTargetRoute"]
        },
        BACK: { actions: ["setResolving", "setTargetRoute"] }
      }
    },

    /**
     * 🎯 ROUTE.SESSION_END
     * This state manages the logout process for user sessions.
     */
    [ROUTE.SESSION_END]: {
      entry: ["setResolved"],
      invoke: {
        src: "guardSession",
        onDone: { actions: ["logout"] },
        onError: { actions: [] }
      },
      on: {
        NEXT: {
          actions: [assign({ targetRoute: { name: ROUTE.HOME } })]
        },
        BACK: { actions: [assign({ targetRoute: { name: ROUTE.HOME } })] }
      }
    }
  },
  guards,
  services,
  actions
};
