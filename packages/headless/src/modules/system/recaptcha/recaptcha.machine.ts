// --- external
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";

// --utils

// --------------------------------------------------------
export default createMachine(
  {
    tsTypes: {} as import("./recaptcha.machine.typegen").Typegen0,
    id: "recaptchaTokenManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      grecaptcha: undefined,
      token: undefined,
      created: undefined,
      error: undefined,
    },
    states: {
      loading: {
        invoke: {
          src: "load",
          onDone: {
            target: "available",
            actions: ["setGrecaptcha"],
          },
          onError: {
            target: "unavailable",
            actions: ["setError"],
          },
        },
      },

      unavailable: {},

      available: {},

      complete: {
        type: "final",
      },
    },
  },
  {
    actions: {
      setGrecaptcha: assign({
        // @ts-ignore
        grecaptcha: (_context, { data }) => data,
      }),

      setError: assign({
        // @ts-ignore
        error: (_context, { data }) => data,
      }),

      // @ts-ignore
      clearError: assign({ error: null }),
    },
    // @ts-ignore
    services,
    guards: {},
    delays: {},
  }
);
