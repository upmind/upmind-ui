// --- internal
import services from "./engine/services";
import actions from "./engine/actions";
import guards from "./engine/guards";

// --- types
import {
  assign,
  type FunnelContext,
  type FunnelProps
} from "@upmind-automation/client-vue";
import { ROUTE } from "./types";

// -----------------------------------------------------------------------------

export default <FunnelProps>{
  id: "labs",
  states: {
    /**
     * 🎯 ROUTE.SESSION
     * This state serves as a routing hub for session-related actions.
     * It always transitions to the SESSION_REGISTER route to handle user registration as the default action.
     */
    [ROUTE.SESSION]: {
      invoke: {
        src: "guardSession",
        onDone: { actions: ["setResolved"] },
        onError: {
          target: ROUTE.SESSION_REGISTER,
          // NB: Preserve targetRoute query (returnUrl) but update route name
          // to SESSION_LOGIN so Vue Router navigates to /auth/login, not /auth.
          // Using inline assign instead of "setUnresolved", "clearTarget" which clears targetRoute.
          actions: [
            assign({
              resolved: false,
              targetRoute: ({ targetRoute }: FunnelContext) => ({
                ...targetRoute,
                name: ROUTE.SESSION_REGISTER
              })
            })
          ]
        }
        // BRAND SETTING TO DECIDE DEFAULT SESSION ROUTE
      }
    },

    /**
     * 🎯 ROUTE.SESSION_LOGIN
     * This state manages the login process for user sessions.
     * It invokes a 'guard' to check if the user is authenticated.
     * When a bid is present, routes to BASKET after auth so `setTargetBasket`
     * loads the correct basket. Otherwise routes to CHECKOUT.
     * From here, users can proceed to the CHECKOUT route or return to the BASKET.
     */
    [ROUTE.SESSION_LOGIN]: {
      entry: ["setCurrency"],
      invoke: {
        src: "guardSession",
        onDone: [
          {
            target: ROUTE.CHECKOUT,
            actions: ["setUnresolved", "clearTarget"],
            cond: "isSameRoute"
          },
          { actions: ["setResolved"] }
        ],
        onError: { actions: ["setResolved"] }
      },
      on: {
        NEXT: {
          target: ROUTE.SESSION_LOGIN,
          // NB: Preserve targetRoute (returnUrl) — only reset resolved flag.
          actions: [assign({ resolved: false })]
        },
        BACK: {
          target: ROUTE.BASKET,
          actions: [assign({ targetRoute: { name: ROUTE.BASKET } })]
        }
      }
    },

    /**
     * 🎯 ROUTE.SESSION_REGISTER
     * This state manages the registration process for new user sessions.
     * It invokes a 'guard' to check if the user is authenticated.
     * When a bid is present, routes to BASKET after auth so `setTargetBasket`
     * loads the correct basket. Otherwise routes to CHECKOUT.
     * From here, users can proceed to the CHECKOUT route or return to the BASKET.
     */
    [ROUTE.SESSION_REGISTER]: {
      invoke: {
        src: "guardSession",
        onDone: [
          {
            target: ROUTE.CHECKOUT,
            actions: ["setUnresolved", "clearTarget"],
            cond: "isSameRoute"
          },
          { actions: ["setResolved"] }
        ],
        onError: { actions: ["setResolved"] }
      },
      on: {
        NEXT: {
          target: ROUTE.SESSION_REGISTER,
          // NB: Preserve targetRoute (returnUrl) — only reset resolved flag.
          actions: [assign({ resolved: false })]
        },
        BACK: {
          target: ROUTE.BASKET,
          actions: [assign({ targetRoute: { name: ROUTE.BASKET } })]
        }
      }
    },

    /**
     * 🎯 ROUTE.SESSION_RECOVER_PASSWORD
     * This state manages the password recovery process for user sessions.
     * It invokes a 'guard' to check if the user is authenticated.
     * If the user is authenticated, it redirects to the BASKET route.
     * From here, users can navigate to the SESSION_LOGIN route to log in after recovering their password.
     */
    [ROUTE.SESSION_RECOVER_PASSWORD]: {
      invoke: {
        src: "guardSession",
        onDone: { actions: ["setResolved"] },
        onError: { actions: ["setResolved"] }
      },
      on: {
        NEXT: {
          target: ROUTE.SESSION_LOGIN,
          actions: [assign({ targetRoute: { name: ROUTE.SESSION_LOGIN } })]
        },
        BACK: {
          target: ROUTE.SESSION_LOGIN,
          actions: [assign({ targetRoute: { name: ROUTE.SESSION_LOGIN } })]
        }
      }
    },

    /**
     * 🎯 ROUTE.SESSION_END
     * This state manages the logout process for user sessions.
     * It invokes a 'guard' to handle session termination.
     * Upon successful logout, it redirects to the CATALOGUE route.
     * From here, users can navigate to the CATALOGUE to continue browsing
     * or return to the BASKET if needed.
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
          target: ROUTE.CATALOGUE,
          actions: [assign({ targetRoute: { name: ROUTE.CATALOGUE } })]
        },
        BACK: {
          target: ROUTE.BASKET,
          actions: [assign({ targetRoute: { name: ROUTE.BASKET } })]
        }
      }
    }
  },
  guards,
  services,
  actions
};
