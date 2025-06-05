// --- external
import type { AnyEventObject } from "xstate";
import { createMachine, assign, actions } from "xstate";
const { escalate } = actions;

// --- internal
import services from "./services";
import type {
  GuestContext,
  LoginModel,
  RecoverModel,
  RegisterModel,
  TWOFAModel,
} from "./types";

import { useDataLayer } from "../../system";
const { dataLayer } = useDataLayer();

import { useFeedback } from "../../feedback";
const { addSuccess } = useFeedback();

// --- utils
import { useValidationParser, useCookies } from "../../../utils";
const { setTopLevel: setCookie } = useCookies();

import {
  use2faModelParser,
  use2faSchemaParser,
  use2faUischemaParser,
  useLoginModelParser,
  useLoginSchemaParser,
  useLoginUischemaParser,
  useRecoverModelParser,
  useRecoverSchemaParser,
  useRecoverUischemaParser,
  useRegisterModelParser,
  useRegisterSchemaParser,
  useRegisterUischemaParser,
} from "./utils";

import { omit } from "lodash-es";
// --- types
import { responseCodes } from "../../../utils";
import { GrantTypes } from "@upmind-automation/types";
import { QueryResponseError } from "src/modules/query";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    //tsTypes: {} as import("./guest.machine.typegen").Typegen0,
    id: "sessionGuest",
    predictableActionArguments: true,
    initial: "loading",
    context: {} as GuestContext,
    states: {
      loading: {
        id: "loading",
        entry: "clearError",
        invoke: {
          src: "load",
          onDone: { target: "available" },
          onError: {
            target: "error",
            actions: escalate(
              (_context: GuestContext, { data }: AnyEventObject) =>
                data?.error || data
            ),
          },
        },
      },

      available: {
        initial: "idle",
        states: {
          idle: {},
          // --- Start the login flow, in essence,
          // show a login form and await an event to authenticate
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
                //     target: "available",
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
                      actions: ["setActor", "pushLogin"],
                    },
                  ],
                  onError: {
                    target: "error",
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
                    actions: ["setActor", "pushLogin"],
                  },
                  onError: {
                    target: "challenging",
                    actions: ["setError", "setFeedbackError"],
                  },
                },
              },
              error: {
                on: {
                  SET: { target: "available", actions: ["setModel"] },
                  AUTHENTICATE: {
                    target: "authenticating",
                    actions: ["setModel"],
                  },
                },
              },
            },
          },

          // --- Start the creation flow,
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
                    target: "error",
                    actions: ["setError", "setFeedbackError"],
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
                  },
                  onError: {
                    target: "error",
                    actions: ["setError", "setFeedbackError"],
                  },
                },
              },
              authenticating: {
                invoke: {
                  src: "authenticate",
                  onDone: {
                    target: "#complete",
                    actions: ["setActor", "pushRegister"],
                  },
                  onError: {
                    target: "error",
                    actions: ["setError", "setFeedbackError"],
                  },
                },
              },
              error: {
                on: {
                  SET: { target: "available", actions: ["setModel"] },
                  REGISTER: { target: "checking", actions: ["setModel"] },
                },
              },
            },
          },

          // --- potential alternate/future form flows
          // social: {}, // when we require a user to log in with a social provider
          // ---
          // confirm: {}, // when we require a user to confirm their email
          // recover: {}, // when we require a user to recover their password

          recover: {
            id: "recover",
            initial: "loading",
            states: {
              loading: {
                always: {
                  target: "available",
                  actions: ["clearError", "setRecoverSchemas"],
                },
              },
              available: {
                on: {
                  RECOVER: { target: "recovering", actions: ["setModel"] },
                },
              },
              recovering: {
                invoke: {
                  src: "recover",
                  onDone: {
                    target: "complete",
                    actions: ["setFeedbackSuccess"],
                  },
                  onError: {
                    target: "error",
                    actions: ["setError", "setFeedbackError"],
                  },
                },
              },
              error: {
                on: {
                  SET: { target: "available", actions: ["setModel"] },
                  RECOVER: { target: "recovering", actions: ["setModel"] },
                },
              },
              complete: {},
            },
          },
        },
        on: {
          LOGIN: { target: "available.login" },
          RECOVER: { target: "available.recover" },
          REGISTER: { target: "available.register" },
          SET: { actions: ["setModel"] },
        },
      },

      // Handle errors
      error: {
        id: "error",
        type: "final",
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
        customFields: (_context: GuestContext, { data }: AnyEventObject) =>
          data,
      }),

      setRegisterSchemas: assign({
        schema: ({ customFields }: GuestContext) =>
          useRegisterSchemaParser(customFields),

        uischema: ({ customFields }: GuestContext) =>
          useRegisterUischemaParser(customFields),

        model: ({ customFields, model }: GuestContext) =>
          useRegisterModelParser(model as RegisterModel, customFields),
      }),

      setLoginSchemas: assign({
        schema: (_context: GuestContext, { data }: AnyEventObject) =>
          useLoginSchemaParser(),
        uischema: (_context: GuestContext, { data }: AnyEventObject) =>
          useLoginUischemaParser(),
        model: ({ model }: GuestContext) =>
          useLoginModelParser(model as LoginModel),
      }),

      set2faSchemas: assign({
        schema: (_context: GuestContext, { data }: AnyEventObject) =>
          use2faSchemaParser(),
        uischema: (_context: GuestContext, { data }: AnyEventObject) =>
          use2faUischemaParser(),
        model: ({ model }: GuestContext) =>
          use2faModelParser(model as TWOFAModel),
      }),

      setRecoverSchemas: assign({
        schema: (_context: GuestContext, { data }: AnyEventObject) =>
          useRecoverSchemaParser(),
        uischema: (_context: GuestContext, { data }: AnyEventObject) =>
          useRecoverUischemaParser(),
        model: ({ model }: GuestContext) =>
          useRecoverModelParser(model as RecoverModel),
      }),

      setModel: assign({
        model: (_context: GuestContext, { data }: AnyEventObject) => data,
      }),
      set2faToken: assign({
        token: (_context: GuestContext, { data }: AnyEventObject) => data,
      }),

      setFeedbackSuccess: (_context: GuestContext, _event: AnyEventObject) => {
        addSuccess("Thanks – reset instructions have been sent to your email.");
      },

      setFeedbackError: ({ error }: GuestContext, _event: AnyEventObject) => {
        return;
        // DC: We have deprecated sending feedback for now...
        // if (!error || error?.status == responseCodes.Unprocessable_Entity) return;

        // addError({
        //   title: "We experienced an error authenticating",
        //   copy: error?.message,
        //   data: error?.data,
        // });
      },

      pushRegister: (_context: GuestContext, _event: AnyEventObject) => {
        dataLayer({ event: "sign_up" }).withUser().push(false);
      },
      pushLogin: (_context: GuestContext, _event: AnyEventObject) => {
        dataLayer({ event: "login" }).withUser().push(false);
      },

      setActor: (_context: GuestContext, { data }: AnyEventObject) => {
        setCookie(
          "upm_actor",
          omit(data?.analytics, ["environment", "language", "version"]),
          {
            expires: "8h",
          }
        );
      },

      // ---

      setError: assign({
        error: (_context: GuestContext, { data }: AnyEventObject) => {
          // console.error("session", "client", "error", { event, state });

          if (data?.status == responseCodes.Unauthorized) {
            // Usually because the refresh token has expired.
            return {
              type: responseCodes.Unauthorized,
              message: data?.error?.message || "Unauthorized",
            } as QueryResponseError;
          }
          if (data?.status == responseCodes.Unprocessable_Entity) {
            // lets parse/override our error message and data
            // this is to generate valid json schema validation errors
            return useValidationParser(data?.error);
          }

          return data?.error ?? data;
        },
      }),

      clearError: assign({ error: undefined }),
    },
    guards: {
      requires2fa: (_context: GuestContext, { data }: any) => {
        return (
          data.actor_type == GrantTypes.TWOFA && !!data?.second_factor_required
        );
      },
      requiresReCaptcha: (_context: GuestContext, { data }: any) =>
        !!data?.recaptcha_required,
    },

    delays: {},
    services,
  }
);
