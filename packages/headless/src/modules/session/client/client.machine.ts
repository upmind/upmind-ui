// --- external
import type { AnyEventObject } from "xstate";
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";
import type { ClientContext } from "./types";
import { useFeedback } from "../../feedback";
const { addError } = useFeedback();

// --- utils
import { useTime } from "../../../utils";
import { dumpTokenFromStorage } from "../utils";

// --- types
import { responseCodes } from "../../../utils";

// --------------------------------------------------------

export default createMachine(
  {
    //tsTypes: {} as import("./client.machine.typegen").Typegen0,
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
                actions: ["setError", "setFeedbackError"],
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
  },
  {
    actions: {
      clear: assign((_context, _event) => {
        localStorage.clear();
        return {};
      }),
      // ---
      setUser: assign({ user: (_context, { data }: AnyEventObject) => data }),
      setTransfer: assign({
        transfer: (_context, { data }: AnyEventObject) => data,
      }),
      clearTransfer: assign({ transfer: null }),
      // ---
      setError: assign({
        error: (context, { data }: AnyEventObject) => data,
      }),

      setFeedbackError: ({ error }, _event) => {
        if (!error || error?.code == responseCodes.Unprocessable_Entity) return;

        addError({
          title: error?.title,
          copy: error?.message,
          data: error?.data,
        });
      },

      clearError: assign({ error: null }),
    },
    guards: {
      hasUser: context => context.user !== null,
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
      expired: () => useTime().MINUTE * 5,
    },
    services,
  }
);
