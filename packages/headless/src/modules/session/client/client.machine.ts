// --- external
import type { AnyEventObject } from "xstate";
import { createMachine, assign } from "xstate";

// --- internal
import { useSystemI18n } from "../../system/i18n/useSystemI18n";
import services from "./services";

import type { ClientContext } from "./types";

import { useDataLayer } from "../../system";
const { dataLayer } = useDataLayer();

import { useFeedback } from "../../feedback";
const { addError } = useFeedback();

// --- utils
import { useTime, useCookies } from "../../../utils";
const { removeTopLevel: removeCookie, setTopLevel: setCookie } = useCookies();
import { useUserParser } from "../utils";
import { omit } from "lodash-es";

// --- types
import { responseCodes } from "../../../utils";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    //tsTypes: {} as import("./client.machine.typegen").Typegen0,
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
          onDone: {
            target: "available",
            actions: ["setActor", "setUser", "setLocale"],
          },
          onError: { target: "complete", actions: ["setError"] },
        },
      },

      processed: {
        id: "processed",
        after: {
          wait: "available",
        },
      },

      available: {
        id: "available",
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
            after: { error: "#available" },
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
        // clear all session data, including cookies and local storage
        //  also update the data layer to indicate the user has logged out
        localStorage.clear();
        removeCookie("upm_actor");
        dataLayer().withPage().withUser().push(false);
        return {};
      }),
      // ---
      setActor: (_context, { data }: AnyEventObject) => {
        setCookie(
          "upm_actor",
          omit(data?.analytics, ["environment", "language", "version"]),
          {
            expires: "8h",
          }
        );
      },

      setUser: assign({
        user: (_context, { data }: AnyEventObject) => useUserParser(data.actor),
      }),
      setLocale: ({ user }) => {
        if (!user) return;
        const locale = user.locale;
        useSystemI18n().setLocale(locale);
      },

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
