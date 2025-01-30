// --- external
import { createMachine, assign } from "xstate";

// --- internal
import { useApi } from "../../api";
import { useBrand } from "../../brand";
import services from "./services";
import type { ClientContext } from "./types";
import { useFeedback } from "../../feedback";
const { addError } = useFeedback();

// --- utils
import { useTime } from "../../../utils";
import { dumpTokenFromStorage } from "../utils";

// --- types
import { responseCodes } from "../../api/types";
import { useI18n } from "@/modules/system/i18n";

// --------------------------------------------------------

export default createMachine(
  {
    // tsTypes: {} as import("./client.machine.typegen").Typegen0,
    id: "sessionClient",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      user: undefined,
      transfer: undefined,
      // ---
      error: undefined,
    } as ClientContext,
    states: {
      loading: {
        id: "loading",
        entry: "clearError",
        invoke: {
          src: "load",
          onDone: { target: "idle", actions: ["setUser", "setLocale"] },
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
      setUser: assign({ user: (_context, { data }) => data }),
      setLocale: ({ user }) => {
        if (!user) return;
        const locale = user.locale;
        useI18n().setLocale(locale);
      },

      // @ts-ignore
      setTransfer: assign({ transfer: (_context, { data }) => data }),
      clearTransfer: assign({ transfer: null }),
      // ---
      setError: assign({
        error: (context, { data }) => data,
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
      // @ts-ignore
      wait: () => useTime().WAIT,
      expired: () => useTime().MINUTE * 5,
    },
    // @ts-ignore
    services,
  }
);
