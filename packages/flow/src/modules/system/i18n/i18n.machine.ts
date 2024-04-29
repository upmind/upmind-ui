// --- external
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";

// --- utils
import { useTime } from "../../../utils";
import { set, unset } from "lodash-es";

// --- types
import type { i18nContext, i18nEvent } from "./types";
// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./i18n.machine.typegen").Typegen0,
    id: "i18nManager",
    predictableActionArguments: true,
    initial: "idle",
    context: {
      activeLocale: "en",
      messages: {},
      // ---
      error: null,
    } as i18nContext,
    states: {
      idle: {
        on: {
          GET: "loading",
          SWITCH: {
            actions: "switchLocale",
          },
        },
      },
      loading: {
        invoke: {
          src: "fetchLocale",
          onDone: {
            target: "processed",
            actions: ["setLocale"],
          },
          onError: {
            target: "error",
            actions: "setError",
          },
        },
      },
      processed: {
        after: {
          wait: [
            { target: "complete", cond: "allLocalesLoaded" },
            { target: "idle" },
          ],
        },
      },
      complete: { type: "final" },
      error: {
        on: {
          RETRY: {
            target: "loading",
            actions: assign({
              error: ({ error }: i18nContext) => {
                unset(error, "messages");
                return error;
              },
            }),
          },
        },
      },
    },
    on: {},
  },
  {
    actions: {
      setLocale: assign({
        messages: ({ messages }: i18nContext, { data }: i18nEvent) => {
          messages ??= {}; // ensure we have a messages object
          set(messages, data.key, data.values);
          return messages;
        },
        activeLocale: (_context, { data }) => data.key,
      }),

      switchLocale: assign({
        activeLocale: (_context, { data }) => data,
      }),
      // ---
      setError: assign({
        error: (_context, { data }) => data,
      }),

      clearError: assign({ error: null }),
    },
    guards: {
      allLocalesLoaded: (_context: i18nContext, _event: i18nEvent) => {
        // TODO: put some checks in place to determine if all locales are loaded
        //  for now well pass through
        return false;
      },
    },
    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },
    services,
  }
);
