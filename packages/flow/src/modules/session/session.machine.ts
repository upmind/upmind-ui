// --- external
import { createMachine, assign, actions } from "xstate";
const { sendTo } = actions;

// --- internal
import services from "./services";
import type { SessionContext } from "./types.d";
import clientMachine from "./client/client.machine";
import guestMachine from "./guest/guest.machine";
import { useFeedback } from "../feedback";
const { addError } = useFeedback();

// --- utils
import { useTokenParser } from "./utils";
import { useTime } from "../../utils";
import { isEqual } from "lodash-es";
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
        actor_type: null,
      },
      history: [],
      user: {},
      refresh: false,
      error: null,
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
                  actions: ["setToken"],
                },
                {
                  target: "guest",
                  actions: ["setToken"],
                },
              ],
              onError: { target: "guest" },
            },
          },
          guest: {
            invoke: {
              id: "guest",
              src: guestMachine,
              autoForward: true,
              data: {
                refresh: context => context.refresh,
              },
              onDone: { target: "#guest", actions: ["setToken"] },
              onError: { actions: ["setError"] },
            },
          },
          client: {
            invoke: {
              id: "client",
              src: clientMachine,
              autoForward: true,
              data: {
                refresh: context => context.refresh,
              },
              onDone: {
                target: "#client",
                actions: ["setHistory", "setToken", "setSuccess"],
              },
              onError: { actions: ["setError"] },
            },
          },
        },
        onDone: {
          actions: ["clearRefresh", "clearError"],
        },
        on: {
          CANCEL: {
            target: "#starting",
            actions: ["clearError"],
          },
        },
      },

      guest: {
        id: "guest",
        initial: "idle",
        states: {
          idle: {
            type: "final",
            on: {
              SELF: { target: "processing" },
            },
          },
          processing: {
            invoke: {
              src: "getUser",
              onDone: {
                target: "idle",
                actions: ["setUser"],
              },
              onError: {
                target: "error",
                actions: ["setError"],
              },
            },
          },
          error: {
            after: { wait: "idle" },
          },
        },
        on: {
          LOGIN: {
            target: "#starting.client",
            actions: [
              "clearError",
              sendTo("client", "LOGIN", { delay: 0 }), // delay needed to only trigger when in the correct state
            ],
          },
          REGISTER: {
            target: "#starting.client",
            actions: [
              "clearError",
              sendTo("client", "REGISTER", { delay: 0 }), // delay needed to only trigger when in the correct state
            ],
          },
          REFRESH: { target: "#starting", actions: "setRefresh" },
          KILL: { target: "#clearing" },
          CANCEL: { target: "#starting", actions: ["clearError"] },
        },
      },

      client: {
        id: "client",
        initial: "idle",
        states: {
          idle: {
            always: [
              {
                cond: "hasNoUser",
                target: "processing",
              },
            ],
          },
          processing: {
            invoke: {
              src: "getUser",
              onDone: {
                target: "idle",
                actions: ["setUser"],
              },
              onError: {
                target: "error",
                actions: ["setError"],
              },
            },
          },

          error: {},
        },
        on: {
          LOGOUT: { target: "#clearing" },
          REFRESH: { target: "#starting", actions: "setRefresh" },
          KILL: { target: "#clearing" },
          CANCEL: { target: "#starting", actions: ["clearError"] },
        },
      },

      // admin: {
      // invoke the admin machine
      // },

      // actor: {
      // invoke the actor machine
      // },

      clearing: {
        id: "clearing",
        invoke: {
          src: "dumpTokens",
          onDone: { target: "#starting", actions: ["clearToken", "clearUser"] },
        },
      },

      // Handle completion, stop the machine and prevent further requests
      complete: {
        entry: ["clearToken", "clearUser"],
        type: "final",
      },
    },
    on: {
      "CLEAR.ERRORS": { actions: ["clearError"] },
    },
  },
  {
    actions: {
      // ---
      setRefresh: assign({ refresh: true }),
      clearRefresh: assign({ refresh: false }),
      // ---
      setHistory: assign({
        history: (context, { data }) => {
          if (isEqual(context.token, data)) return context.history;
          context.history.push(context.token);
          return context.history;
        },
      }),
      setToken: assign({ token: (context, { data }) => useTokenParser(data) }),
      clearToken: assign({ token: {}, history: [] }),
      // ---
      setUser: assign({ user: (_context, { data }) => data }),
      clearUser: assign({ user: {} }),
      // ---
      setSuccess: (_context, _event) => {
        // addSuccess("Successfully logged in");
      },

      setError: assign({
        error: (context, { data }) => {
          addError({
            title: data?.title || "We experienced an error",
            copy: data?.message,
            data: data?.data,
          });

          return data;
        },
      }),

      clearError: assign({ error: null }),
    },
    guards: {
      hasError: ({ error }) => !!error,
      hasNoError: ({ error }) => !error,
      // ---
      hasNoUser: ({ user }) => !user?.id,
      // ---
      isClientToken: (_context, { data }) => data?.type === "client",
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },
    services,
  }
);
