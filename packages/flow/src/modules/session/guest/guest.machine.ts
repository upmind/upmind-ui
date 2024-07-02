// --- external
import { createMachine, assign, actions } from "xstate";
const { escalate } = actions;

// --- internal
import services from "./services";
import type { GuestContext } from "./types.d";
import { useFeedback } from "../../feedback";
const { trackEvent } = useFeedback();

// --- utils
import { dumpTokensFromStorage } from "../utils";
import {
  useValidationParser,
  useRegisterSchemaParser,
  useRegisterUischemaParser,
  useRegisterModelParser,
  useLoginSchemaParser,
  useLoginUischemaParser,
  useLoginModelParser,
  use2faSchemaParser,
  use2faUischemaParser,
  use2faModelParser,
} from "./utils";

// --- types
import { responseCodes } from "../../api/types.d";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./guest.machine.typegen").Typegen0,
    id: "sessionGuest",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      // ---
      error: null,
    } as GuestContext,
    states: {
      // our initial state will check 'self' and see if we have a token
      // if we do, we can continue to the completed state, if not, we are unauthenticated,
      loading: {
        id: "loading",
        entry: "clearError",
        invoke: {
          src: "check",
          onDone: { target: "idle" },
          onError: { target: "#unauthenticated", actions: ["clear"] },
        },
      },

      // in this state, we are unauthenticated, and we need to generate a "guest" token
      unauthenticated: {
        id: "unauthenticated",
        invoke: {
          src: "generateToken",
          onDone: {
            target: "idle",
          },
          onError: {
            target: "#error",
            actions: ["setError", "escalateError"],
          },
        },
      },

      idle: {
        on: {
          LOGIN: { target: "login" },
          REGISTER: { target: "register" },
        },
      },
      // --- Start the login flow
      // in essence show a login form and await an event to authenticate
      login: {
        id: "login",
        initial: "loading",
        states: {
          loading: {
            always: {
              target: "available",
              actions: ["clearError", "setLoginSchemas"],
            },
            // after: {
            //   wait: {
            //     target: "idle",
            //     actions: ["clearError", "setLoginSchemas"]
            //   }
            // }
          },
          // loading: {} // loading state not required?
          available: {
            on: {
              AUTHENTICATE: {
                target: "authenticating",
                actions: ["setModel"],
              },
            },
          },
          authenticating: {
            invoke: {
              src: "authenticate",
              onDone: [
                {
                  target: "challenging",
                  actions: ["set2faToken", "set2faSchemas"],
                  cond: "requires2fa",
                },
                {
                  target: "#complete",
                  actions: ["trackLogin"],
                },
              ],
              onError: {
                target: "available",
                actions: ["setError", "escalateError"],
              },
            },
          },
          challenging: {
            on: {
              VERIFY: { target: "verifying" },
              CANCEL: { target: "available" },
            },
          },
          verifying: {
            invoke: {
              src: "verify2fa",
              onDone: {
                target: "#complete",
              },
              onError: {
                target: "challenging",
                actions: ["setError", "escalateError"],
              },
            },
          },
        },
      },

      // --- Start the create flow
      // in essence show a register form, possibly with custom fields, and await an event to register
      register: {
        id: "register",
        initial: "loading",
        states: {
          loading: {
            invoke: {
              src: "getCustomFields",
              onDone: {
                target: "available",
                actions: ["setCustomFields", "setRegisterSchemas"],
              },
              onError: {
                target: "#error",
                actions: ["setError", "escalateError"],
              },
            },
          },
          available: {
            on: {
              REGISTER: { target: "checking", actions: ["setModel"] },
            },
          },
          checking: {
            invoke: {
              src: "checkForReCaptcha",
              onDone: [
                { target: "challenging", cond: "requiresReCaptcha" },
                { target: "registering" },
              ],
              onError: {
                target: "available",
                actions: ["setError", "escalateError"],
              },
            },
          },
          challenging: {
            on: {
              VERIFY: { target: "verifying" },
            },
          },
          verifying: {
            invoke: {
              src: "verifyReCaptcha",
              onDone: {
                target: "registering",
                actions: [],
              },
              onError: {
                target: "challenging",
                actions: ["setError", "escalateError"],
              },
            },
          },
          registering: {
            invoke: {
              src: "register",
              onDone: {
                target: "authenticating",
                actions: ["trackRegister"],
              },
              onError: {
                target: "available",
                actions: ["setError", "escalateError"],
              },
            },
          },
          authenticating: {
            invoke: {
              src: "authenticate",
              onDone: {
                target: "#complete",
              },
              onError: {
                target: "available",
                actions: ["setError", "escalateError"],
              },
            },
          },
        },
      },

      // --- potential alternate/future form flows
      // social: {}, // when we require user to login with a social provider
      // ---
      // confirm: {}, // when we require user to confirm their email
      // recover: {},  // when we require user to recover their password
      // reset: {}, // when we user is in the process of reset their password

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
      clear: assign({
        token: (_context, _event) => {
          dumpTokensFromStorage();
          return null;
        },
      }),
      setCustomFields: assign({
        customFields: (_context, { data }) => data,
      }),

      setRegisterSchemas: assign({
        schema: ({ customFields }) => useRegisterSchemaParser(customFields),
        uischema: ({ customFields }) => useRegisterUischemaParser(customFields),
        model: ({ customFields }) => useRegisterModelParser(customFields),
      }),

      setLoginSchemas: assign({
        schema: _context => useLoginSchemaParser(),
        uischema: _context => useLoginUischemaParser(),
        model: _context => useLoginModelParser(),
      }),

      set2faSchemas: assign({
        schema: _context => use2faSchemaParser(),
        uischema: _context => use2faUischemaParser(),
        model: _context => use2faModelParser(),
      }),

      setModel: assign({
        model: (_context, { data }) => data,
      }),
      set2faToken: assign({
        token: (_context, { data }) => data,
      }),
      trackRegister: (_context, { data }) => {
        trackEvent({
          event: "sign_up",
          upmind: {
            user_id: data?.actor_id,
          },
        });
      },
      trackLogin: (_context, { data }) => {
        trackEvent({
          event: "login",
          upmind: {
            user_id: data?.actor_id,
          },
        });
      },
      // ---

      setError: assign({
        error: (_context, event, state) => {
          console.error("session", "client", "error", { event, state });

          const data = event?.data;

          if (data?.error?.code == responseCodes.Unauthorized) {
            // Usually because the refresh token has expired.
            return {
              code: responseCodes.Unauthorized,
              message: data.error.message || "Unauthorized",
            };
          }

          if (data?.error?.code == responseCodes.Unprocessable_Entity) {
            // lets parse/override our error message and data
            // this is to generate valid json schema validation errors
            return useValidationParser(data?.error);
          }

          return data?.error || data || event?.error || event || null;
        },
      }),
      escalateError: escalate(({ error }) => error),

      clearError: assign({ error: null }),
    },
    guards: {
      requires2fa: (_context, { data }) =>
        data.actor_type == "twofa" && !!data?.second_factor_required,
      requiresReCaptcha: (_context, { data }) => !!data?.recaptcha_required,
    },

    delays: {},
    services,
  }
);
