// --- external
import type { AnyEventObject } from "xstate";
import { createMachine, assign, actions } from "xstate";
const { escalate } = actions;

// --- internal
import services from "./services";
import type { GuestContext } from "./types";
import { useFeedback } from "../../feedback";
const { trackEvent, addError } = useFeedback();

// --- utils
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
import { responseCodes } from "../../../utils";

// ---
export default createMachine(
  {
    //tsTypes: {} as import("./guest.machine.typegen").Typegen0,
    id: "sessionGuest",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      // ---
      error: null,
    } as GuestContext,
    states: {
      loading: {
        id: "loading",
        entry: "clearError",
        invoke: {
          src: "load",
          onDone: { target: "idle" },
          onError: {
            target: "error",
            actions: escalate(
              (_context, { data }: AnyEventObject) => data?.error || data
            ),
          },
        },
      },

      processed: {
        id: "processed",
        after: {
          wait: "idle",
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
              REGISTER: { target: "#register" },
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
                actions: ["setError", "setFeedbackError"],
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
                actions: ["trackLogin"],
              },
              onError: {
                target: "challenging",
                actions: ["setError", "setFeedbackError"],
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
                actions: ["setError", "setFeedbackError"],
              },
            },
          },
          available: {
            on: {
              REGISTER: { target: "checking", actions: ["setModel"] },
              LOGIN: { target: "#login" },
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
                actions: ["setError", "setFeedbackError"],
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
                actions: ["setError", "setFeedbackError"],
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
                actions: ["setError", "setFeedbackError"],
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
                actions: ["setError", "setFeedbackError"],
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
      setCustomFields: assign({
        customFields: (_context, { data }: AnyEventObject) => data,
      }),

      setRegisterSchemas: assign({
        schema: ({ customFields }: GuestContext) =>
          useRegisterSchemaParser(customFields),

        uischema: ({ customFields }: GuestContext) =>
          useRegisterUischemaParser(customFields),

        model: ({ customFields }: GuestContext) =>
          useRegisterModelParser(customFields),
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
        model: (_context, { data }: AnyEventObject) => data,
      }),
      set2faToken: assign({
        token: (_context, { data }: AnyEventObject) => data,
      }),

      setFeedbackError: ({ error }, _event) => {
        if (!error || error?.code == responseCodes.Unprocessable_Entity) return;

        addError({
          title: error?.title,
          copy: error?.message,
          data: error?.data,
        });
      },

      trackRegister: (_context, { data }: any) => {
        trackEvent({
          event: "sign_up",
          upmind: {
            user_id: data?.actor_id,
          },
        });
      },
      trackLogin: (_context, { data }: any) => {
        trackEvent({
          event: "login",
          upmind: {
            user_id: data?.actor_id,
          },
        });
      },
      // ---

      setError: assign({
        error: (_context, event: any, state) => {
          // console.error("session", "client", "error", { event, state });

          const data: any = event?.data;

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

      clearError: assign({ error: null }),
    },
    guards: {
      requires2fa: (_context, { data }: any) =>
        data.actor_type == "twofa" && !!data?.second_factor_required,
      requiresReCaptcha: (_context, { data }: any) =>
        !!data?.recaptcha_required,
    },

    delays: {},
    services,
  }
);
