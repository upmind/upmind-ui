// --- external
import type { AnyEventObject } from "xstate";
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";
import { RecaptchaContext } from "./types";
import { isString } from "xstate/lib/utils";
import { isEmpty, set } from "lodash-es";

// --utils
import { mapToHeadlessError, useTime } from "../../../utils";
// -----------------------------------------------------------------------------
export default createMachine(
  {
    //tsTypes: {} as import("./recaptcha.machine.typegen").Typegen0,
    id: "recaptchaTokenManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as RecaptchaContext,
    states: {
      subscribing: {
        on: {
          SET_SITE_KEY: {
            target: "loading",
            actions: ["setSiteKey"],
            cond: "isValidSiteKey",
          },
        },
      },

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
        initial: "idle",
        states: {
          idle: {
            on: {
              GENERATE_TOKEN: {
                target: "processing",
              },
            },
          },
          processing: {
            invoke: {
              src: "generateToken",
              onDone: {
                target: "processed",
                actions: ["setToken"],
              },
              onError: {
                target: "error",
                actions: ["setError"],
              },
            },
          },
          processed: {
            after: {
              expired: {
                target: "idle",
                actions: ["clearToken"],
              },
            },
          },
          error: {
            after: {
              error: {
                target: "idle",
                actions: ["clearToken", "clearError"],
              },
            },
          },
        },
        on: {
          CLEAR: {
            target: "available.idle",
            actions: ["clearToken", "clearError"],
          },
        },
      },

      complete: {
        type: "final",
      },
    },
  },
  {
    actions: {
      setSiteKey: assign({
        siteKey: (_context, { siteKey }: AnyEventObject) => siteKey,
      }),
      setGrecaptcha: assign({
        grecaptcha: (_context, { data }: AnyEventObject) => data,
      }),

      setToken: assign({
        token: (_context, { data }: AnyEventObject) => data,
      }),
      clearToken: assign({
        token: _context => undefined,
      }),

      setError: assign({
        error: (_context, { data }: AnyEventObject) => mapToHeadlessError(data),
      }),
      clearError: assign({
        error: _context => undefined,
      }),
    },

    services: services as any,
    guards: {
      isValidSiteKey: (_context, event) => {
        return isString(event.siteKey) && !isEmpty(event.siteKey);
      },
    },
    delays: {
      expired: () => useTime().MINUTE * 2,
      error: () => useTime().ERROR,
    },
  }
);
