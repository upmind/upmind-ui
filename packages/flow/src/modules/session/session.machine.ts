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
import { useTime } from "../../utils";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./session.machine.typegen").Typegen0,
    id: "sessionManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      token: {},
      refresh: false,
      error: null
    } as SessionContext,
    states: {
      // our initial state will check 'self' and see if we have a token
      // if we do, we can skip generating a token
      // TODO: add necessary cheand and states when we add user accounts with auth
      loading: {
        id: "loading",
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
              data: {
                refresh: context => context.refresh
              },
              onDone: { target: "#idle.guest", actions: ["setToken"] },
              onError: { target: "#error", actions: ["setError"] }
            }
          },
          client: {
            invoke: {
              id: "client",
              src: clientMachine,
              onDone: { target: "#idle.client", actions: ["setToken"] },
              onError: { target: "#error", actions: ["setError"] }
            }
          }
        },
        exit: "clearRefresh"
      },

      idle: {
        id: "idle",
        initial: "none",
        states: {
          none: {},
          guest: {
            on: {
              REFRESH: { target: "#loading", actions: "setRefresh" },
              KILL: { target: "#clearing" }
            }
          },
          client: {
            on: {
              REFRESH: { target: "#loading", actions: "setRefresh" },
              LOGIN: { target: "#loading", actions: "setCredentials" },
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
        }
      },

      clearing: {
        id: "clearing",
        invoke: {
          src: "dumpToken",
          onDone: { target: "#loading", actions: ["clearToken"] }
        }
      },

      // Handle errors
      error: {
        id: "error"
      },

      // Handle completion, stop the machine and prevent further requests
      complete: {
        id: "complete",
        entry: "clearToken",
        type: "final"
      }
    }
  },
  {
    actions: {
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
      isClientToken: (_context, { data }) => {
        return data?.type === "client";
      }

      // isAdminToken: (_context, { data }) => {
      //   debugger;
      //   return data?.type === "admin";
      // },
      // isActorToken: (_context, { data }) => {
      //   debugger;
      //   return data?.actor_type === "actor";
      // }
    },

    delays: {},
    services
  }
);
