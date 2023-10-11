// --- external
import { createMachine, assign, actions } from "xstate";
const { sendTo } = actions;

// --- internal
import services from "./services";
import type { SessionContext } from "./types.d";
import clientMachine from "./client/client.machine";
import guestMachine from "./guest/guest.machine";
// --- utils
import { useTokenParser } from "./utils";
import { includes } from "lodash-es";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./session.machine.typegen").Typegen0,
    id: "sessionManager",
    predictableActionArguments: true,
    initial: "starting",
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
      error: null
    } as SessionContext,
    states: {
      // our initial state will check 'self' and see if we have a token
      // if we do, we can skip generating a token
      // TODO: add necessary cheand and states when we add user accounts with auth
      starting: {
        id: "starting",
        initial: "check",
        states: {
          check: {
            invoke: {
              src: "check",
              onDone: [
                // { target: "valid.admin", cond: "isAdminToken", actions: ["setToken"]  },
                // { target: "valid.actor", cond: "isActorToken", actions: ["setToken"] },
                {
                  target: "client",
                  cond: "isClientToken",
                  actions: ["setToken"]
                },
                {
                  target: "guest",
                  actions: ["setToken"]
                }
              ],
              onError: { target: "guest" }
            }
          },
          guest: {
            invoke: {
              id: "guest",
              src: guestMachine,
              autoForward: true,
              data: {
                refresh: context => context.refresh
              },
              onDone: { target: "#idle.guest", actions: ["setToken"] },
              onError: { actions: ["setError"] }
            }
          },
          client: {
            invoke: {
              id: "client",
              src: clientMachine,
              autoForward: true,
              onDone: { target: "#idle.client", actions: ["setToken"] },
              onError: { actions: ["setError"] }
            }
          }
        },
        onDone: {
          target: "#idle",
          actions: ["clearRefresh", "clearError"]
        },
        on: {
          CANCEL: {
            target: "#starting",
            actions: ["clearError"]
          }
        }
      },

      idle: {
        id: "idle",
        initial: "none",
        states: {
          none: {},
          guest: {
            on: {
              LOGIN: {
                target: "#starting.client",
                actions: [
                  "clearError",
                  sendTo("client", "LOGIN", { delay: 0 }) // delay needed to only trigger when in the correct state
                ]
              },
              REGISTER: {
                target: "#starting.client",
                actions: [
                  "clearError",
                  sendTo("client", "REGISTER", { delay: 0 }) // delay needed to only trigger when in the correct state
                ]
              },
              REFRESH: { target: "#starting", actions: "setRefresh" },
              KILL: { target: "#clearing" }
            }
          },
          client: {
            on: {
              REFRESH: { target: "#starting", actions: "setRefresh" },
              LOGOUT: { target: "#clearing" },
              KILL: { target: "#clearing" }
            }
          }

          // admin: {
          // invoke the admin machine
          // },
          // actor: {
          // invoke the actor machine
          // },
        },
        on: {
          CANCEL: {
            target: "#starting",
            actions: ["clearError"]
          }
        }
      },

      clearing: {
        id: "clearing",
        invoke: {
          src: "dumpTokens",
          onDone: { target: "#starting", actions: ["clearToken"] }
        }
      },

      // Handle completion, stop the machine and prevent further requests
      complete: {
        entry: "clearToken",
        type: "final"
      }
    }
  },
  {
    actions: {
      // ---
      setRefresh: assign({ refresh: true }),
      clearRefresh: assign({ refresh: false }),
      // ---
      setToken: assign({ token: (context, { data }) => useTokenParser(data) }),
      clearToken: assign({ token: {} }),
      // ---
      setError: assign({
        error: (context, { data }) => data || "Unknown error"
      }),
      clearError: assign({ error: null })
    },
    guards: {
      hasError: ({ error }) => !!error,
      hasNoError: ({ error }) => !error,

      // ---
      isClientToken: (_context, { data }) => data?.type === "client"
    },

    delays: {},
    services
  }
);
