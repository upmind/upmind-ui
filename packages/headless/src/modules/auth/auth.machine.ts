/** @internal */
import { createMachine, assign } from "xstate";
import { BrandConfigKeys, TwofaProviders } from "@upmind-automation/types";
import { useBrand } from "../brand";
import { useFeedback } from "../feedback";
import { useI18n } from "../system-localisation";
import { ScopeActorTypes } from "../scope";
import {
  useLoginSchema,
  useLoginUischema,
  useRegisterSchema,
  useRegisterUischema,
  useRecoverSchema,
  useRecoverUischema,
  useTwoFASchema,
  useTwoFAUischema
} from "./auth.schemas";
import { authMachineServices } from "./auth.services";
import {
  mapToHeadlessError,
  parseError,
  responseCodes,
  useTime,
  useValidationParser
} from "../../utils";
import { cloneDeep } from "lodash-es";
import type { AuthContext, LoginModel, RegisterModel } from "./auth.types";
import type { AnyEventObject } from "xstate";
// -----------------------------------------------------------------------------
/**
 * @internal
 * @module auth/machine
 * @description Auth state machine.
 * Unified XState machine for all authentication flows (guest, client, staff).
 * Handles login, registration, password recovery, and 2FA verification states.
 *
 * WARNING: Do not import directly. Use via useAuth composable only.
 *
 * @style Prefer destructuring context and event parameters where possible:
 *        `({ model }: AuthContext, { data }: AnyEventObject) => ...`
 */
// -----------------------------------------------------------------------------
export const authMachine = createMachine(
  {
    id: "auth",
    predictableActionArguments: true,
    initial: "checking",
    context: {} as AuthContext,

    // --- Global events (handled in any state)
    on: {
      GUEST: {
        target: "#registeringGuest",
        cond: "canRegisterAsGuest"
      }
    },

    states: {
      // --- Check if already authenticated for this scopeActor scope
      checking: {
        id: "checking",
        entry: "setContext",
        invoke: {
          src: "checkSession",
          onDone: { target: "authenticated" },
          onError: [
            {
              target: "login.processing",
              cond: "isGuest"
            },
            {
              target: "login.processing",
              cond: "hasContext"
            },
            {
              target: "idle"
            }
          ]
        }
      },

      // --- Entry state (no existing session)
      idle: {
        id: "idle",
        on: {
          LOGIN: {
            target: "login",
            actions: "setLoginSchemas"
          },
          REGISTER: {
            target: "register",
            cond: "canRegister",
            actions: "setRegisterSchemas"
          },
          RECOVER: {
            target: "recover",
            cond: "canRecover",
            actions: "setRecoverSchemas"
          }
        }
      },

      // --- Guest registration flow (M5) — GUEST scope only
      registeringGuest: {
        id: "registeringGuest",
        invoke: {
          src: "registerAsGuest",
          onDone: {
            target: "#authenticated",
            actions: ["setToken"]
          },
          onError: {
            target: "idle",
            actions: ["setError"]
          }
        }
      },

      // --- Login Flow
      login: {
        id: "login",
        initial: "available",
        on: {
          CANCEL: "#idle",
          // Navigation to other flows (guarded by scopeActor capabilities)
          REGISTER: {
            target: "#register",
            cond: "canRegister",
            actions: "setRegisterSchemas"
          },
          RECOVER: {
            target: "#recover",
            cond: "canRecover",
            actions: "setRecoverSchemas"
          }
        },
        states: {
          // --- Available: form ready, waiting for user input
          available: {
            initial: "checking",
            on: {
              SET: { target: ".checking", actions: "setModel" },
              AUTHENTICATE: { target: "#login.processing", actions: "setModel" }
            },
            states: {
              checking: {
                entry: ["clearError"],
                initial: "parsing",
                states: {
                  parsing: {
                    invoke: {
                      src: "parse",
                      onDone: { target: "validating", actions: ["setModel"] }
                    }
                  },
                  validating: {
                    invoke: {
                      src: "validate",
                      onDone: { target: "#login.available.valid" },
                      onError: {
                        target: "#login.available.invalid",
                        actions: ["setError"]
                      }
                    }
                  }
                }
              },
              valid: {},
              invalid: {},
              error: {
                on: {
                  SET: { target: "#login.available", actions: "setModel" },
                  AUTHENTICATE: {
                    target: "#login.processing",
                    actions: "setModel"
                  }
                }
              }
            }
          },

          // --- Processing: validating then calling the API
          processing: {
            initial: "checking",
            states: {
              checking: {
                entry: ["clearError"],
                invoke: {
                  src: "validate",
                  onDone: { target: "authenticating" },
                  onError: {
                    target: "#login.available.error",
                    actions: ["setError"]
                  }
                }
              },
              authenticating: {
                invoke: {
                  src: "authenticate",
                  onDone: [
                    {
                      target: "#login.challenging",
                      cond: "requires2fa",
                      actions: ["setToken", "persistModel", "set2faSchemas"]
                    },
                    {
                      target: "#authenticated",
                      actions: ["setToken"]
                    }
                  ],
                  onError: [
                    {
                      target: "#error",
                      cond: "isTooManyAttempts",
                      actions: ["setError"]
                    },
                    {
                      target: "#login.available.error",
                      actions: ["setError", "incrementRetry"]
                    }
                  ]
                }
              }
            }
          },

          // --- 2FA Challenge
          challenging: {
            initial: "idle",
            on: {
              SET: { actions: ["setModel"] },
              VERIFY: "verifying",
              CANCEL: {
                target: "#login.available",
                actions: ["resetModel", "setLoginSchemas", "clearError"]
              }
            },
            states: {
              idle: {},
              invalid: {}
            }
          },

          // --- Verifying 2FA
          verifying: {
            invoke: {
              src: "verify2fa",
              onDone: {
                target: "#authenticated",
                actions: ["setToken"]
              },
              onError: [
                {
                  target: "#error",
                  cond: "isTooManyAttempts",
                  actions: ["setError"]
                },
                {
                  target: "#login.challenging.invalid",
                  cond: "isEmailTwofa",
                  actions: ["setError", "set2faError", "clear2faToken"]
                },
                {
                  target: "#login.challenging.invalid",
                  actions: ["setError", "set2faError"]
                }
              ]
            }
          }
        }
      },

      // --- Register Flow (Client Only)
      register: {
        id: "register",
        initial: "loading",
        on: {
          CANCEL: "#idle",
          // Navigation to other flows (guarded by scopeActor capabilities)
          LOGIN: { target: "#login", actions: "setLoginSchemas" },
          RECOVER: {
            target: "#recover",
            cond: "canRecover",
            actions: "setRecoverSchemas"
          }
        },
        states: {
          // --- Loading: fetch lookups (custom fields etc)
          loading: {
            invoke: {
              src: "loadLookups",
              onDone: {
                target: "available",
                actions: ["setLookups", "updateRegisterSchemas"]
              },
              onError: {
                target: "unavailable",
                actions: ["setError"]
              }
            }
          },

          // --- Unavailable: loading failed
          unavailable: {},

          // --- Available: form ready, waiting for user input
          available: {
            initial: "checking",
            on: {
              SET: { target: ".checking", actions: "setModel" },
              REGISTER: { target: "#register.processing", actions: "setModel" }
            },
            states: {
              checking: {
                entry: ["clearError"],
                initial: "parsing",
                states: {
                  parsing: {
                    invoke: {
                      src: "parse",
                      onDone: { target: "validating", actions: ["setModel"] }
                    }
                  },
                  validating: {
                    invoke: {
                      src: "validate",
                      onDone: { target: "#register.available.valid" },
                      onError: {
                        target: "#register.available.invalid",
                        actions: ["setError"]
                      }
                    }
                  }
                }
              },
              valid: {},
              invalid: {},
              error: {
                on: {
                  REGISTER: {
                    target: "#register.processing",
                    actions: "setModel"
                  }
                }
              }
            }
          },

          // --- Processing: register then authenticate
          processing: {
            initial: "registering",
            states: {
              registering: {
                entry: ["clearError"],
                invoke: {
                  src: "register",
                  onDone: { target: "authenticating" },
                  onError: [
                    {
                      target: "#error",
                      cond: "isTooManyAttempts",
                      actions: ["setError"]
                    },
                    {
                      target: "#register.available.error",
                      actions: ["setError", "incrementRetry"]
                    }
                  ]
                }
              },
              authenticating: {
                invoke: {
                  src: "authenticate",
                  onDone: [
                    {
                      target: "#register.challenging",
                      cond: "requires2fa",
                      actions: ["setToken", "persistModel", "set2faSchemas"]
                    },
                    {
                      target: "#authenticated",
                      actions: ["setToken"]
                    }
                  ],
                  onError: [
                    {
                      target: "#error",
                      cond: "isTooManyAttempts",
                      actions: ["setError"]
                    },
                    {
                      target: "#register.available.error",
                      actions: ["setError", "incrementRetry"]
                    }
                  ]
                }
              }
            }
          },

          // --- 2FA Challenge (after registration)
          challenging: {
            initial: "idle",
            on: {
              SET: { actions: ["setModel"] },
              VERIFY: "verifying",
              CANCEL: {
                target: "#register.available",
                actions: ["resetModel", "setRegisterSchemas", "clearError"]
              }
            },
            states: {
              idle: {},
              invalid: {}
            }
          },

          // --- Verifying 2FA (after registration)
          verifying: {
            invoke: {
              src: "verify2fa",
              onDone: {
                target: "#authenticated",
                actions: ["setToken"]
              },
              onError: [
                {
                  target: "#error",
                  cond: "isTooManyAttempts",
                  actions: ["setError"]
                },
                {
                  target: "#register.challenging.invalid",
                  cond: "isEmailTwofa",
                  actions: ["setError", "set2faError", "clear2faToken"]
                },
                {
                  target: "#register.challenging.invalid",
                  actions: ["setError", "set2faError"]
                }
              ]
            }
          }
        }
      },

      // --- Recover Flow
      recover: {
        id: "recover",
        initial: "available",
        on: {
          CANCEL: "#idle",
          // Navigation to other flows (guarded by scopeActor capabilities)
          LOGIN: { target: "#login", actions: "setLoginSchemas" },
          REGISTER: {
            target: "#register",
            cond: "canRegister",
            actions: "setRegisterSchemas"
          }
        },
        states: {
          // --- Available: form ready, waiting for user input
          available: {
            initial: "checking",
            on: {
              SET: { target: ".checking", actions: "setModel" },
              RECOVER: { target: "#recover.processing", actions: "setModel" }
            },
            states: {
              checking: {
                entry: ["clearError"],
                initial: "parsing",
                states: {
                  parsing: {
                    invoke: {
                      src: "parse",
                      onDone: { target: "validating", actions: ["setModel"] }
                    }
                  },
                  validating: {
                    invoke: {
                      src: "validate",
                      onDone: { target: "#recover.available.valid" },
                      onError: {
                        target: "#recover.available.invalid",
                        actions: ["setError"]
                      }
                    }
                  }
                }
              },
              valid: {},
              invalid: {},
              error: {
                on: {
                  RECOVER: {
                    target: "#recover.processing",
                    actions: "setModel"
                  }
                }
              }
            }
          },

          // --- Processing: validating then calling the API
          processing: {
            initial: "checking",
            states: {
              checking: {
                entry: ["clearError"],
                invoke: {
                  src: "validate",
                  onDone: { target: "recovering" },
                  onError: {
                    target: "#recover.available.error",
                    actions: ["setError"]
                  }
                }
              },
              recovering: {
                invoke: {
                  src: "recover",
                  onDone: {
                    target: "#recover.complete",
                    actions: ["setFeedbackSuccess"]
                  },
                  onError: [
                    {
                      target: "#error",
                      cond: "isTooManyAttempts",
                      actions: ["setError"]
                    },
                    {
                      target: "#recover.available.error",
                      actions: ["setError"]
                    }
                  ]
                }
              }
            }
          },

          // --- Complete: recovery email sent
          complete: {
            on: {
              LOGIN: { target: "#login", actions: "setLoginSchemas" }
            }
          }
        }
      },

      // --- Global error state with timed recovery (rate limits, etc.)
      error: {
        id: "error",
        after: {
          wait: { target: "checking" }
        }
      },

      // --- Authenticated: final state, emits done event with auth data
      authenticated: {
        id: "authenticated",
        type: "final",
        data: ({ token }: AuthContext) => ({ token })
      }
    }
  },
  {
    // --- Actions
    actions: {
      setContext: assign(
        ({ scopeActor, scopeContext, brandId }: AuthContext) => ({
          scopeActor: scopeActor ?? ScopeActorTypes.GUEST,
          scopeContext,
          brandId,
          retryCount: 0,
          model: {},
          lookups: {}
        })
      ),

      setLoginSchemas: assign(() => ({
        schema: useLoginSchema(),
        uischema: useLoginUischema(),
        model: {}
      })),

      setRegisterSchemas: assign(() => ({
        schema: useRegisterSchema(),
        uischema: useRegisterUischema(),
        model: {}
      })),

      updateRegisterSchemas: assign(({ lookups }: AuthContext) => ({
        schema: useRegisterSchema(lookups?.customFields),
        uischema: useRegisterUischema(lookups?.customFields)
      })),

      setRecoverSchemas: assign(() => ({
        schema: useRecoverSchema(),
        uischema: useRecoverUischema(),
        model: {}
      })),

      set2faSchemas: assign(
        (_context: AuthContext, { data }: AnyEventObject) => ({
          schema: useTwoFASchema(),
          uischema: useTwoFAUischema(data?.twofa_provider)
        })
      ),

      setModel: assign({
        model: ({ model }: AuthContext, { data }: AnyEventObject) =>
          data ?? model
      }),

      setToken: assign({
        token: (_context: AuthContext, { data }: AnyEventObject) =>
          data?.session ?? data?.token
      }),

      setLookups: assign({
        lookups: ({ lookups }: AuthContext, { data }: AnyEventObject) => ({
          ...lookups,
          customFields: data ?? []
        })
      }),

      setError: assign({
        error: (_context: AuthContext, { data }: AnyEventObject) => {
          const error = mapToHeadlessError(data);
          if (error?.status == responseCodes.Unprocessable_Entity) {
            error.data = useValidationParser(error);
          }
          return error;
        }
      }),

      set2faError: assign({
        error: ({ error }: AuthContext) => {
          if (!error?.message) return error;
          return {
            ...error,
            data: parseError(error.message, "token")
          };
        }
      }),

      clear2faToken: assign({
        model: ({ model }: AuthContext) => ({ ...model, token: "" })
      }),

      persistModel: assign({
        baseModel: ({ model }: AuthContext) => cloneDeep(model)
      }),

      resetModel: assign({
        model: ({ baseModel }: AuthContext) => cloneDeep(baseModel)
      }),

      setFeedbackSuccess: () => {
        const { t } = useI18n();
        useFeedback().addSuccess(t("confirm.reset_instructions_sent_msg"));
      },

      clearError: assign({ error: undefined }),

      incrementRetry: assign({
        retryCount: ({ retryCount }: AuthContext) => (retryCount ?? 0) + 1
      })
    },

    // --- Guards
    guards: {
      isGuest: ({ scopeActor }: AuthContext) =>
        scopeActor === ScopeActorTypes.GUEST,

      /** Guard: Has a context entity ID (impersonation/child-client). */
      hasContext: ({ scopeContext }: AuthContext) => !!scopeContext?.id,

      /** Guard: Actor can register (only when acting as self, no context). */
      canRegister: ({ scopeContext }: AuthContext) => !scopeContext,

      /** Guard: Actor can recover password (only when acting as self, no context). */
      canRecover: ({ scopeContext }: AuthContext) => !scopeContext,

      /**
       * Guard (M5/F3b): guest registration is enabled for this brand.
       * Routing guest registration through the machine behind this guard is what
       * makes the GUEST_CHECKOUT_ENABLED gate non-bypassable.
       */
      canRegisterAsGuest: () =>
        !!useBrand().getConfigValue<boolean>(
          BrandConfigKeys.GUEST_CHECKOUT_ENABLED
        ),

      requires2fa: (_context: AuthContext, { data }: AnyEventObject) =>
        !!data?.requires2fa,

      isTooManyAttempts: (_context: AuthContext, { data }: AnyEventObject) => {
        const error = mapToHeadlessError(data);
        return error?.status === responseCodes.Too_Many_Requests;
      },

      isEmailTwofa: ({ token }: AuthContext) =>
        token?.twofa_provider === TwofaProviders.EMAIL
    },

    // --- Services
    services: authMachineServices,

    // --- Delays
    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    }
  }
);

export default authMachine;
