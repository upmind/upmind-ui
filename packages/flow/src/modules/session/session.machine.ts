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
      error: null,
      message: null
    } as SessionContext,
    states: {
      // our initial state will check 'self' and see if we have a token
      // if we do, we can skip generating a token
      // TODO: add necessary cheand and states when we add user accounts with auth
      loading: {
        id: "loading",
        type: "parallel",
        states: {
          role: {
            id: "role",
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
                  onError: { actions: ["setError", "clearMessage"] }
                },
                on: {
                  MESSAGE: {
                    actions: ["setMessage"]
                  }
                }
              },
              client: {
                invoke: {
                  id: "client",
                  src: clientMachine,
                  onDone: { target: "#idle.client", actions: ["setToken"] },
                  onError: { actions: ["setError", "clearMessage"] }
                },
                on: {
                  MESSAGE: {
                    actions: ["setMessage"]
                  },
                  LOGIN: {
                    actions: sendTo("client", (context, { data }) => ({
                      type: "LOGIN",
                      data
                    }))
                  }
                }
              }
            },
            onDone: {
              target: "#idle",
              actions: ["clearRefresh", "clearError", "clearMessage"]
            }
          },
          status: {
            initial: "waiting",
            states: {
              waiting: {
                always: [
                  { target: "processing", cond: "hasMessage" },
                  { target: "error", cond: "hasError" }
                ]
              },
              processing: {
                always: [
                  { target: "error", cond: "hasError" },
                  { target: "waiting", cond: "hasNoMessage" }
                ]
              },
              error: {
                always: { target: "waiting", cond: "hasNoError" }
              }
            }
          }
        },
        on: {
          SWAP: [
            {
              target: "#loading.role.client",
              cond: "isClientRole",
              actions: ["clearMessage", "clearError"]
            },
            {
              target: "#loading.role.guest",
              cond: "isGuestRole",
              actions: ["clearMessage", "clearError"]
            }
          ]
        }
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
          SWAP: [
            {
              target: "#loading.role.client",
              cond: "isClientRole",
              actions: ["clearMessage", "clearError"]
            },
            {
              target: "#loading.role.guest",
              cond: "isGuestRole",
              actions: ["clearMessage", "clearError"]
            }
          ]
        }
      },

      clearing: {
        id: "clearing",
        invoke: {
          src: "dumpTokens",
          onDone: { target: "#loading", actions: ["clearToken"] }
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
      setMessage: assign({
        message: (context, { data }) => data
      }),

      clearMessage: assign({ message: false }),
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
      hasMessage: ({ message }) => !!message,
      hasNoMessage: ({ message }) => !message,
      // ---
      isClientRole: (_context, { data }) => data === "client",
      isGuestRole: (_context, { data }) => !data || data === "guest",
      // ---
      isClientToken: (_context, { data }) => data?.type === "client"
    },

    delays: {},
    services
  }
);
