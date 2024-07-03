// --- external
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";
import type { ClientContext } from "./types.d";

// --- utils
import { useTime } from "../../../utils";
import { dumpTokensFromStorage } from "../utils";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./client.machine.typegen").Typegen0,
    id: "sessionClient",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      user: null,
      transfer: null,
      // ---
      error: null,
    } as ClientContext,
    states: {
      loading: {
        id: "loading",
        entry: "clearError",
        invoke: {
          src: "load",
          onDone: { target: "idle", actions: "setUser" },
          onError: { target: "complete", actions: ["setError"] },
        },
      },

      // in this state, we are attempting to refresh our token which has expired),
      // we will clear the token and go back to our unauthenticated state
      // which will generate a new token
      refreshing: {
        id: "refreshing",
        invoke: {
          src: "refreshToken",
          onDone: { target: "processed" },
          onError: {
            target: "loading",
            actions: "setError",
          },
        },
      },

      processed: {
        id: "processed",
        after: {
          wait: "idle",
        },
      },

      idle: {
        id: "idle",
        on: {
          LOGOUT: {
            target: "complete",
            actions: "clear",
          },
          TRANSFER: {
            target: "transferring",
          },
        },
      },

      transferring: {
        initial: "initiating",
        states: {
          initiating: {
            invoke: {
              src: "transfer",
              onDone: {
                target: "available",
                actions: "setTransfer",
              },
              onError: {
                target: "unavailable",
                actions: "setError",
              },
            },
          },

          available: {
            after: {
              expired: {
                target: "unavailable",
                actions: "clearTransfer",
              },
            },
          },

          unavailable: {
            after: { error: "#idle" },
          },
        },
      },

      // Handle completion, stop the machine and prevent further requests
      complete: {
        id: "complete",
        type: "final",
      },
    },
    on: {
      REFRESH: "refreshing",
    },
  },
  {
    actions: {
      clear: assign((context, _event) => {
        dumpTokensFromStorage();
        return {};
      }),
      // ---
      setUser: assign({ user: (_context, { data }) => data }),
      setTransfer: assign({ transfer: (_context, { data }) => data }),
      clearTransfer: assign({ transfer: null }),
      // ---
      setError: assign({
        error: (context, { data }) => data,
      }),

      clearError: assign({ error: null }),
    },
    guards: {},

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
      expired: () => useTime().MINUTE * 5,
    },
    services,
  }
);
