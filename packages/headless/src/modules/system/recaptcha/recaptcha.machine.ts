// --- external
import type { AnyEventObject } from "xstate";
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";

// --utils

// ---
export default createMachine(
  {
    //tsTypes: {} as import("./recaptcha.machine.typegen").Typegen0,
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
        grecaptcha: (_context, { data }: AnyEventObject) => data,
      }),

      setError: assign({
        error: (_context, { data }: AnyEventObject) => data,
      }),
    },

    services,
    guards: {},
    delays: {},
  }
);
