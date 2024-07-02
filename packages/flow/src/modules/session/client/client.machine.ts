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
      error: null,
      transfer: null,
    } as ClientContext,
    states: {
      // our initial state will check 'self' and see if we have a token
      // if we do, we move to the complete state and attempt to refresh if needed
      // if we don't, we move to the unauthenticated state and await a login or register event
      // TODO: add checks for if a client needs to confirm their email, or is in a recovery flow
      // and then we move to the appropriate state
      loading: {
        id: "loading",
        entry: "clearError",
        invoke: {
          src: "check",
          onDone: { target: "#complete" },
          onError: { target: "complete" },
        },
      },

      idle: {
        id: "idle",
        always: [
          {
            cond: "hasNoUser",
            target: "processing",
          },
        ],
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

      processing: {
        invoke: {
          src: "getUser",
          onDone: {
            target: "idle",
            actions: "setUser",
          },
          onError: {
            target: "idle",
            actions: "setError",
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

      // Handle errors
      error: {
        id: "error",
      },

      // Handle completion, stop the machine and prevent further requests
      complete: {
        id: "complete",
        type: "final",
      },
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
    },
    services,
  }
);
