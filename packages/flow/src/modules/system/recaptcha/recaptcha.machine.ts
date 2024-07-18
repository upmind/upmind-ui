// --- external
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";
import { useTime } from "../../../utils";

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

      available: {
        on: {
          GENERATE: { target: "processing" },
        },
      },

      // Process the request through our service
      processing: {
        invoke: {
          id: "process",
          src: "generate",
          onDone: {
            target: "complete",
            actions: ["setToken"],
          },
          onError: { target: "unavailable", actions: ["setError"] }, // TODO throw an auth feedback message
        },
      },

      // Our completed state IF/WHEN we have a Token
      // automatically moves back to available after token expires to allow for new token generation
      // Once the token is used we listen for a CLEAR event to manually clear the token
      complete: {
        id: "complete",
        after: { expires: { target: "available", actions: "clearToken" } },
        on: {
          CLEAR: { target: "available", actions: "clearToken" },
        },
      },
    },
  },
  {
    actions: {
      setGrecaptcha: assign({
        grecaptcha: (_context, { data }) => data,
      }),
      setToken: assign({
        token: (context, { data }) => data,
        created: () => Date.now(),
      }),

      clearToken: assign({ token: undefined, created: undefined }),

      setError: assign({
        error: (context, { data }) => data,
      }),

      // escalateError: escalate(_context, ({ data }) => data),

      clearError: assign({ error: null }),
    },
    services,
    guards: {
      hasToken: ({ token }) => !!token,
    },
    delays: {
      expires: () => useTime().MINUTE * 2, // token expiry time
    },
  }
);
