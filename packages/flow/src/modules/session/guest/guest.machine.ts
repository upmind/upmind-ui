// --- external
import { createMachine, assign, actions } from "xstate";
const { escalate } = actions;

// --- internal
import services from "./services";
import type { GuestContext } from "./types.d";
import { responseCodes } from "../../api/types.d";

// --- utils
import { useTokenParser } from "../utils";

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
      refresh: false,
      // ---
      error: null
    } as GuestContext,
    states: {
      // our initial state will check 'self' and see if we have a token
      // if we do, we can are authenticated, if not, we are unauthenticated,
      loading: {
        id: "loading",
        entry: "clearError",
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
              onDone: {
                target: "#authenticated",
                actions: ["setToken"]
              },
              onError: {
                target: "#error",
                actions: ["setError", "escalateError"]
              }
            }
          }
        }
      },

      // in this state, we are authenticated, and we can either refresh or kill the token
      authenticated: {
        id: "authenticated",
        initial: "idle",
        states: {
          idle: {
            always: [
              { target: "refreshing", cond: "isRefreshing" },
              { target: "persisting" }
            ]
          },
          // in this state, we are attempting to refresh our token
          // if we are unauthorized (refresh token has expired),
          // we will clear the token and go back to our unauthenticated state
          // which will generate a new token
          refreshing: {
            id: "refreshing",
            invoke: {
              src: "refreshToken",
              onDone: { target: "persisting", actions: ["setToken"] },
              onError: [
                {
                  target: "clearing",
                  cond: "isUnauthorized",
                  actions: ["setError", "escalateError"]
                },
                { target: "#error", actions: ["setError", "escalateError"] }
              ]
            }
          },
          // in this state, we are removing our token to localStorage,
          // and then we start over
          clearing: {
            id: "clearing",
            invoke: {
              src: "dumpToken",
              onDone: [
                { target: "#loading", cond: "isRefreshing" },
                { target: "#complete" }
              ]
            },
            exit: "clearToken"
          },
          // in this state, we are persisting our token to localStorage,
          // and then we are done
          persisting: {
            id: "persisting",
            invoke: {
              src: "persistToken",
              onDone: {
                target: "#complete"
              }
            }
          }
        }
      },

      // Handle errors
      error: {
        id: "error"
      },

      // Handle completion, stop the machine and prevent further requests
      complete: {
        id: "complete",
        type: "final",
        data: (context, event) => context.token
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
      escalateError: escalate(({ error }) => error),

      clearError: assign({ error: null })
    },
    guards: {
      isRefreshing: context => !!context.refresh,
      isUnauthorized: (_context, { data }) =>
        data?.status === responseCodes.Unauthorized
    },

    delays: {},
    services
  }
);
