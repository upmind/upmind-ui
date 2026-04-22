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
  TWOFAModel
} from "./types";

import { useDataLayer, useI18n } from "../../system";

import { useFeedback } from "../../feedback";

// --- utils
import {
  useValidationParser,
  useCookies,
  mapToHeadlessError
} from "../../../utils";
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
  useRegisterUischemaParser
} from "./utils";
import { cloneDeep, omit } from "lodash-es";

// --- types
import { responseCodes } from "../../../utils";
import { GrantTypes } from "@upmind-automation/types";

// -----------------------------------------------------------------------------
export default createMachine(
  {
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
            )
          }
        }
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
                  actions: ["clearError", "setLoginSchemas"]
                }
                // after: {
                //   wait: {
                //     target: "available",
                //     actions: ["clearError", "setLoginSchemas"]
                //   }
                // }
              },
              // loading: {} // loading state not required?
              available: {
                initial: "checking",
                states: {
                  checking: {
                    invoke: {
                      src: "validate",
                      onDone: { target: "valid", actions: ["clearError"] },
                      onError: { target: "invalid", actions: ["setError"] }
                    }
                  },
                  valid: {},
                  invalid: {}
                },
                on: {
                  SET: { target: ".checking", actions: ["setModel"] },
                  AUTHENTICATE: {
                    target: "authenticating",
                    actions: ["setModel"]
                  }
                }
              },
              authenticating: {
                invoke: {
                  src: "authenticate",
                  onDone: [
                    {
                      target: "challenging",
                      actions: ["set2faToken", "persistModel", "set2faSchemas"],
                      cond: "requires2fa"
                    },
                    {
                      target: "#complete",
                      actions: ["setActor", "pushLogin"]
                    }
                  ],
                  onError: {
                    target: "error",
                    actions: ["setError", "setFeedbackError"]
                  }
                }
              },
              challenging: {
                initial: "checking",
                states: {
                  checking: {
                    invoke: {
                      src: "validate",
                      onDone: {
                        target: "#login.verifying",
                        actions: ["clearError"]
                      },
                      onError: { target: "invalid", actions: ["setError"] }
                    }
                  },
                  valid: {},
                  invalid: {}
                },
                on: {
                  SET: { target: ".checking", actions: ["setModel"] },
                  VERIFY: { target: "verifying" },
                  CANCEL: {
                    target: "available",
                    actions: ["resetModel", "setLoginSchemas", "clearError"]
                  }
                }
              },
              verifying: {
                invoke: {
                  src: "verify2fa",
                  onDone: {
                    target: "#complete",
                    actions: ["setActor", "pushLogin"]
                  },
                  onError: {
                    target: "challenging.invalid",
                    actions: ["setError", "setFeedbackError"]
                  }
                }
              },
              error: {
                on: {
                  SET: { target: "available", actions: ["setModel"] },
                  AUTHENTICATE: {
                    target: "authenticating",
                    actions: ["setModel"]
                  }
                }
              }
            }
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
                    actions: ["setCustomFields", "setRegisterSchemas"]
                  },
                  onError: {
                    target: "error",
                    actions: ["setError", "setFeedbackError"]
                  }
                }
              },
              available: {
                initial: "checking",
                states: {
                  checking: {
                    invoke: {
                      src: "validate",
                      onDone: { target: "valid", actions: ["clearError"] },
                      onError: { target: "invalid", actions: ["setError"] }
                    }
                  },
                  valid: {},
                  invalid: {}
                },
                on: {
                  SET: { target: ".checking", actions: ["setModel"] },
                  REGISTER: { target: "registering", actions: ["setModel"] }
                }
              },
              registering: {
                invoke: {
                  src: "register",
                  onDone: {
                    target: "authenticating"
                  },
                  onError: {
                    target: "error",
                    actions: ["setError", "setFeedbackError"]
                  }
                }
              },
              authenticating: {
                invoke: {
                  src: "authenticate",
                  onDone: [
                    {
                      target: "challenging",
                      actions: ["set2faToken", "persistModel", "set2faSchemas"],
                      cond: "requires2fa"
                    },
                    {
                      target: "#complete",
                      actions: ["setActor", "pushRegister"]
                    }
                  ],
                  onError: {
                    target: "error",
                    actions: ["setError", "setFeedbackError"]
                  }
                }
              },
              challenging: {
                initial: "checking",
                states: {
                  checking: {
                    invoke: {
                      src: "validate",
                      onDone: {
                        target: "#register.verifying",
                        actions: ["clearError"]
                      },
                      onError: { target: "invalid", actions: ["setError"] }
                    }
                  },
                  valid: {},
                  invalid: {}
                },
                on: {
                  SET: { target: ".checking", actions: ["setModel"] },
                  VERIFY: { target: "verifying" },
                  CANCEL: {
                    target: "available",
                    actions: ["resetModel", "setRegisterSchemas", "clearError"]
                  }
                }
              },
              verifying: {
                invoke: {
                  src: "verify2fa",
                  onDone: {
                    target: "#complete",
                    actions: ["setActor", "pushRegister"]
                  },
                  onError: {
                    target: "challenging.invalid",
                    actions: ["setError", "setFeedbackError"]
                  }
                }
              },
              error: {
                on: {
                  SET: { target: "available", actions: ["setModel"] },
                  REGISTER: { target: "registering", actions: ["setModel"] }
                }
              }
            }
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
                  actions: ["clearError", "setRecoverSchemas"]
                }
              },
              available: {
                on: {
                  RECOVER: { target: "recovering", actions: ["setModel"] }
                }
              },
              recovering: {
                invoke: {
                  src: "recover",
                  onDone: {
                    target: "complete",
                    actions: ["setFeedbackSuccess"]
                  },
                  onError: {
                    target: "error",
                    actions: ["setError", "setFeedbackError"]
                  }
                }
              },
              error: {
                on: {
                  SET: { target: "available", actions: ["setModel"] },
                  RECOVER: { target: "recovering", actions: ["setModel"] }
                }
              },
              complete: {}
            }
          },

          asGuest: {
            id: "asGuest",
            initial: "registering",
            states: {
              registering: {
                invoke: {
                  src: "registerAsGuest",
                  onDone: {
                    target: "#complete",
                    actions: ["setActor", "pushLogin"]
                  },
                  onError: {
                    target: "error",
                    actions: ["setError", "setFeedbackError"]
                  }
                }
              },
              error: {
                on: {
                  GUEST: { target: "registering" }
                }
              }
            }
          }
        },
        on: {
          GUEST: { target: "available.asGuest" },
          LOGIN: { target: "available.login" },
          RECOVER: { target: "available.recover" },
          REGISTER: { target: "available.register" },
          SET: { actions: ["setModel"] }
        }
      },

      // Handle errors
      error: {
        id: "error",
        type: "final"
      },

      // Handle completion, stop the machine and prevent further requests
      complete: {
        id: "complete",
        type: "final"
      }
    }
  },
  {
    actions: {
      setCustomFields: assign({
        customFields: (_context: GuestContext, { data }: AnyEventObject) => data
      }),

      setRegisterSchemas: assign({
        schema: ({ customFields }: GuestContext) =>
          useRegisterSchemaParser(customFields),

        uischema: ({ customFields }: GuestContext) =>
          useRegisterUischemaParser(customFields),

        model: ({ customFields, model }: GuestContext) =>
          useRegisterModelParser(model as RegisterModel, customFields)
      }),

      setLoginSchemas: assign({
        schema: (_context: GuestContext, { data }: AnyEventObject) =>
          useLoginSchemaParser(),
        uischema: (_context: GuestContext, { data }: AnyEventObject) =>
          useLoginUischemaParser(),
        model: ({ model }: GuestContext) =>
          useLoginModelParser(model as LoginModel)
      }),

      set2faSchemas: assign({
        schema: (_context: GuestContext, { data }: AnyEventObject) =>
          use2faSchemaParser(),
        uischema: (_context: GuestContext, { data }: AnyEventObject) =>
          use2faUischemaParser(data?.twofa_provider),
        model: ({ model }: GuestContext) =>
          use2faModelParser(model as TWOFAModel)
      }),

      setRecoverSchemas: assign({
        schema: (_context: GuestContext, { data }: AnyEventObject) =>
          useRecoverSchemaParser(),
        uischema: (_context: GuestContext, { data }: AnyEventObject) =>
          useRecoverUischemaParser(),
        model: ({ model }: GuestContext) =>
          useRecoverModelParser(model as RecoverModel)
      }),

      setModel: assign({
        model: (_context: GuestContext, { data }: AnyEventObject) => data
      }),
      set2faToken: assign({
        token: (_context: GuestContext, { data }: AnyEventObject) => data
      }),

      persistModel: assign({
        baseModel: ({ model }: GuestContext) => cloneDeep(model)
      }),

      resetModel: assign({
        model: ({ baseModel }: GuestContext) => cloneDeep(baseModel)
      }),

      setFeedbackSuccess: (_context: GuestContext, _event: AnyEventObject) => {
        const { t } = useI18n();
        useFeedback().addSuccess(t("confirm.reset_instructions_sent_msg"));
      },

      setFeedbackError: ({ error }: GuestContext, _event: AnyEventObject) => {
        return;
        // DC: We have deprecated sending feedback for now...
        // if (!error || error?.status == responseCodes.Unprocessable_Entity) return;

        // useFeedback().addError({
        //   title: "We experienced an error authenticating",
        //   copy: error?.message,
        //   data: error?.data,
        // });
      },

      pushRegister: (_context: GuestContext, _event: AnyEventObject) => {
        useDataLayer().dataLayer({ event: "sign_up" }).withUser().push(false);
      },
      pushLogin: (_context: GuestContext, _event: AnyEventObject) => {
        useDataLayer().dataLayer({ event: "login" }).withUser().push(false);
      },

      setActor: (_context: GuestContext, { data }: AnyEventObject) => {
        setCookie(
          "upm_actor",
          omit(data?.analytics, ["environment", "language", "version"]),
          {
            expires: "8h"
          }
        );
      },

      // ---

      setError: assign({
        error: (_context: GuestContext, { data }: AnyEventObject) => {
          let error = mapToHeadlessError(data);

          if (error?.status == responseCodes.Unauthorized) {
            error.message ??= "Unauthorized";
          }

          if (error?.status == responseCodes.Unprocessable_Entity) {
            error.data = useValidationParser(error);
          }

          return error;
        }
      }),

      clearError: assign({ error: undefined })
    },
    guards: {
      requires2fa: (_context: GuestContext, { data }: AnyEventObject) => {
        return (
          data.actor_type == GrantTypes.TWOFA && !!data?.second_factor_required
        );
      }
    },

    delays: {},
    services
  }
);
