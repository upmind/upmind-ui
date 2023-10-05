// --- external
import { createMachine, assign, sendParent } from "xstate";

// --- internal
import services from "./services";
import type { GuestContext } from "./types.d";
import { responseCodes } from "../../api/types.d";

// --- utils
import { useTokenParser } from "../utils";
import { useTime } from "../../../utils";
import { toNumber } from "lodash-es";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./guest.machine.typegen").Typegen0,
    id: "guest",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      token: {
        access_token: null,
        created_at: null,
        expires_in: null,
        refresh_expires_in: null,
        refresh_token: null,
        second_factor_required: null,
        token_type: null,
        // ---
        redirect: null,
        actor_id: null,
        actor_type: null
      },
      // ---
      error: null
    } as GuestContext,
    states: {
      // our initial state will check 'self' and see if we have a token
      // if we do, we can are authenticated, if not, we are unauthenticated,
      loading: {
        id: "loading",
        invoke: {
          src: "check",
          onDone: { target: "#authenticated", actions: ["setToken"] },
          onError: { target: "#unauthenticated", actions: ["clearToken"] }
        }
      },

      // in this state, we are unauthenticated, and we need to generate a "guest" token
      unauthenticated: {
        id: "unauthenticated",
        initial: "idle",
        states: {
          idle: {
            always: { target: "generating" }
          },

          generating: {
            id: "generating",
            invoke: {
              src: "generateToken",
              onDone: { target: "#authenticated" },
              onError: { target: "#error" }
            }
          },

          refreshing: {
            id: "refreshing",
            invoke: {
              src: "refreshToken",
              onDone: { target: "#authenticated" },
              onError: [
                {
                  target: "#loading",
                  cond: "isUnauthorized",
                  actions: ["clearToken"]
                },
                { target: "#error" }
              ]
            }
          }
        }
      },

      // in this state, we are authenticated, and we can either refresh or kill the token
      // We automatically move into a stale state  based on the token/local storage refresh time
      authenticated: {
        id: "authenticated",
        initial: "persisting",
        states: {
          persisting: {
            id: "persisting",
            entry: "setToken",
            invoke: {
              src: "persistToken",
              onDone: {
                target: "idle",
                actions: sendParent(({ token }) => ({
                  type: "AUTHENTICATED",
                  data: token
                }))
              }
            }
          },
          idle: {
            after: { expires: { target: "stale", cond: "hasExpiry" } },
            on: {
              KILL: { target: "#complete" }
            }
          },
          stale: {
            on: {
              REFRESH: { target: "#unauthenticated.refreshing" },
              KILL: { target: "#complete" }
            }
          }
        },
        on: {
          REFRESH: { target: "#unauthenticated.refreshing" }
        }
      },

      // Handle errors
      error: {
        entry: "setError",
        id: "error",
        after: {
          wait: "#complete" // automatically shut down
        },
        on: {
          RETRY: { target: "#loading", actions: ["clearError"] },
          KILL: { target: "#complete" }
        }
      },

      // Handle completion, stop the machine and prevent further requests
      complete: {
        id: "complete",
        invoke: {
          src: "dumpToken",
          onDone: {
            actions: [
              "clearToken",
              sendParent(({ token }) => ({
                type: "UNAUTHENTICATED"
              }))
            ]
          },
          onError: { target: "#error", actions: ["setError"] }
        },
        type: "final"
      }
    }
  },
  {
    actions: {
      setToken: assign({
        token: (context, { data }) => useTokenParser(data)
      }),
      clearToken: assign({
        token: {}
      }),
      // ---
      setError: assign({
        error: (context, { data }) => data || "Unknown error"
      }),

      clearError: assign({ error: null })
    },
    guards: {
      isUnauthorized: context => {
        // guest
        debugger;
        return context?.error?.status === responseCodes.Unauthorized;
      },
      hasExpiry: context => toNumber(context.token.expires_in) > 0
    },

    delays: {
      expires: context =>
        toNumber(context.token.expires_in) * 1000 || useTime().HOUR, // use the refresh time if we have it, but its in seconds so we need to convert to ms
      wait: () => useTime().MINUTE // this allows us to wait for a reasonable amount of time before continuing
    },
    services
  }
);
