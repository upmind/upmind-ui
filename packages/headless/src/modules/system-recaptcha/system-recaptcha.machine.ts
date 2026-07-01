/** @internal */
import { createMachine, assign } from "xstate";
import { isString } from "xstate/lib/utils";
import services from "./system-recaptcha.services";
import { mapToHeadlessError, useTime } from "../../utils";
import { isEmpty } from "lodash-es";
import type { RecaptchaContext } from "./system-recaptcha.types";
import type { AnyEventObject } from "xstate";
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
          DISABLE: {
            target: "unavailable"
          },
          SET_SITE_KEY: {
            target: "loading",
            actions: ["setSiteKey"],
            cond: "isValidSiteKey"
          }
        }
      },

      loading: {
        invoke: {
          src: "load",
          onDone: {
            target: "available",
            actions: ["setGrecaptcha"]
          },
          onError: {
            target: "unavailable",
            actions: ["setError"]
          }
        }
      },

      unavailable: {},

      available: {
        on: {
          GENERATE_TOKEN: {
            target: "processing"
          }
        }
      },

      processing: {
        invoke: {
          src: "generateToken",
          onDone: {
            target: "processed",
            actions: ["setToken"]
          },
          onError: {
            target: "error",
            actions: ["setError"]
          }
        }
      },

      processed: {
        after: {
          expired: {
            target: "available",
            actions: ["clearToken"]
          }
        }
      },

      error: {
        after: {
          error: {
            target: "available",
            actions: ["clearToken", "clearError"]
          }
        }
      },

      complete: {
        type: "final"
      }
    },
    on: {
      CLEAR: {
        target: "available",
        actions: ["clearToken", "clearError"]
      }
    }
  },
  {
    actions: {
      setSiteKey: assign({
        siteKey: (_context, { siteKey }: AnyEventObject) => siteKey
      }),
      setGrecaptcha: assign({
        grecaptcha: (_context, { data }: AnyEventObject) => data
      }),

      setToken: assign({
        token: (_context, { data }: AnyEventObject) => data
      }),
      clearToken: assign({
        token: _context => undefined
      }),

      setError: assign({
        error: (_context, { data }: AnyEventObject) => mapToHeadlessError(data)
      }),
      clearError: assign({
        error: _context => undefined
      })
    },

    services: services as any,
    guards: {
      isValidSiteKey: (_context, event) => {
        return isString(event.siteKey) && !isEmpty(event.siteKey);
      }
    },
    delays: {
      expired: () => useTime().MINUTE * 2,
      error: () => useTime().ERROR
    }
  }
);
