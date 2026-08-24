/** @internal */
import { createMachine, assign, spawn } from "xstate";
import { useRegisterSchema, useRegisterUischema } from "../auth";
import { useBrand } from "../brand";
import { useFeedback } from "../feedback";
import { ScopeActorTypes } from "../scope";
import { authSubscription } from "../session-store";
import { useI18n } from "../system-localisation";
import {
  useGuestEmailSchemaParser,
  useGuestEmailUischemaParser,
  useVerifyEmailSchemaParser,
  useVerifyEmailUischemaParser
} from "./account.schemas";
import services from "./account.services";
import { ClientFormType } from "./account.types";
import {
  useTime,
  useCookies,
  mapToHeadlessError,
  useValidationParser,
  parseError
} from "../../utils";
import { responseCodes } from "../../utils";
import type { ClientContext, GuestEmailModel } from "./account.types";
import type { RegisterModel } from "../auth";
import type { AnyEventObject } from "xstate";

const { removeTopLevel: _removeCookie } = useCookies();
// -----------------------------------------------------------------------------
/**
 * @module account/account.machine
 * @description Account machine — the post-auth standing arc (unregistered →
 * unverified → verified). Reads ONLY its own context; the concrete client is
 * seeded at construction by `createAccountForScope`.
 */
// -----------------------------------------------------------------------------
export default createMachine(
  {
    //tsTypes: {} as import("./account.machine.typegen").Typegen0,
    id: "account",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {
      client: undefined,
      // ---
      error: undefined
    } as ClientContext,
    states: {
      // Routes off the construction-seeded `context.client`. Available only when
      // the resolved scope actor is a CLIENT with a client present; otherwise
      // unavailable (guests/staff have no account lifecycle). No store read and
      // no `/self` fetch — the scoped factory seeds the client at construction.
      subscribing: {
        id: "subscribing",
        entry: ["setAuthHelper", "clearError"],
        always: [
          { target: "available", cond: "isClient" },
          { target: "unavailable" }
        ]
      },

      // Active session is not a client (guest/staff/none) — no lifecycle.
      // REFRESH with client data re-routes to subscribing (handles late user load).
      unavailable: {
        id: "unavailable",
        on: {
          REFRESH: {
            target: "subscribing",
            actions: ["setClient"]
          }
        }
      },

      available: {
        id: "available",
        initial: "checking",
        states: {
          // Routes the loaded client into `unregistered` (guest customer),
          // `unverified` (full client owing email verification), or `verified`
          // (full, verified client) based on context. The sub-states gate which
          // events are valid (e.g. only guests can COMPLETE_REGISTRATION; only
          // verified clients can TRANSFER_TO). Guest is checked first so a guest
          // never falls into the verification branch.
          checking: {
            always: [
              {
                target: "unregistered",
                actions: ["setRegisterSchemas"],
                cond: "isGuestClient"
              },
              {
                target: "unverified",
                actions: ["setVerifyEmailSchemas"],
                cond: "isUnverified"
              },
              { target: "verified" }
            ]
          },

          // Guest customer. Hosts the two guest-client forms — the upgrade
          // (register) form and the checkout email form — mirroring the guest
          // machine's `available.{register,recover}` shape. The UI enters a
          // form via REGISTER / EMAIL before submitting, so the form schema
          // (set here) is owned by this machine, not borrowed from the (now
          // gone) guest machine.
          unregistered: {
            id: "unregistered",
            initial: "loading",
            states: {
              // Register-form schema fetch (custom fields). Email form needs no
              // load — EMAIL sets its schema synchronously on the transition.
              loading: {
                invoke: {
                  src: "getCustomFields",
                  onDone: {
                    target: "checking",
                    actions: ["setCustomFields", "setRegisterSchemas"]
                  },
                  onError: {
                    target: "error",
                    actions: ["setRegisterSchemas"]
                  }
                }
              },
              // The shared form surface. `formType` (set by REGISTER/EMAIL) says
              // whether it's hosting the upgrade or the checkout-email form.
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
                      onDone: { target: "#unregistered.valid" },
                      onError: {
                        target: "#unregistered.invalid",
                        actions: ["setError"]
                      }
                    }
                  }
                }
              },
              valid: {
                on: {
                  COMPLETE_REGISTRATION: {
                    target: "registering",
                    cond: "isRegisterForm"
                  },
                  UPDATE_GUEST_EMAIL: {
                    target: "updating",
                    cond: "isEmailForm"
                  }
                }
              },
              invalid: {},
              // Upgrade submit. `registering`/`updating` override the region's
              // SET with a no-op so the form can't be re-edited while a request
              // is in flight.
              registering: {
                invoke: {
                  src: "completeRegistration",
                  onDone: {
                    target: "#available.checking",
                    actions: ["setClient"]
                  },
                  onError: {
                    target: "error",
                    actions: ["setError", "setFeedbackError"]
                  }
                },
                on: {
                  SET: {
                    /*do nothing */
                  }
                }
              },
              // Email autosave.
              updating: {
                invoke: {
                  src: "updateGuestEmail",
                  onDone: {
                    target: "valid",
                    actions: ["clearError", "setClientEmail"]
                  },
                  onError: { target: "error", actions: ["setError"] }
                },
                on: {
                  SET: {
                    /*do nothing */
                  }
                }
              },
              // Submit failure (drives the alert); distinct from `invalid`
              // (client validation).
              error: {}
            },
            on: {
              SET: { target: ".checking", actions: ["setModel"] },
              REGISTER: { actions: ["setRegisterSchemas"] },
              EMAIL: { actions: ["setEmailSchemas"] },
              CANCEL: { target: ".checking" }
            }
          },

          // Full client owing email verification. The verify-email form is
          // always ready while unverified — visibility is owned by routing (the
          // verify-email overlay), not by the machine. The form (validate-on-SET)
          // mirrors the guest 2fa `challenging` shape; on success it re-enters
          // `#available` → `checking`, which — the email now verified — routes to
          // `verified`.
          unverified: {
            type: "parallel",
            states: {
              // Verify-email form (validate-on-SET; mirrors the guest 2fa shape).
              challenging: {
                id: "challenging",
                initial: "loading",
                states: {
                  // Register-form schema fetch (custom fields). Email form needs no
                  // load — EMAIL sets its schema synchronously on the transition.
                  loading: {
                    always: {
                      target: "checking",
                      actions: ["setVerifyEmailSchemas"]
                    }
                  },

                  checking: {
                    initial: "parsing",
                    states: {
                      parsing: {
                        invoke: {
                          src: "parse",
                          onDone: {
                            target: "validating",
                            actions: ["setModel"]
                          }
                        }
                      },
                      validating: {
                        invoke: {
                          src: "validate",
                          onDone: {
                            target: "#challenging.valid",
                            actions: ["clearError"]
                          },
                          onError: {
                            target: "#challenging.invalid",
                            actions: ["setError"]
                          }
                        }
                      }
                    }
                  },
                  valid: {},
                  invalid: {},
                  verifying: {
                    invoke: {
                      src: "verifyEmailCode",
                      onDone: {
                        // POST success is authoritative — flip the local flag and
                        // transition straight to `available`. Avoids a race where a
                        // fresh `/self` call could return stale `verified: 0`.
                        target: "#available",
                        actions: ["markEmailVerified"]
                      },
                      onError: {
                        target: "invalid",
                        actions: ["setVerificationError"]
                      }
                    },
                    on: {
                      SET: {
                        /*do nothing */
                      },
                      VERIFY: {
                        /*do nothing */
                      }
                    }
                  },
                  error: {}
                },
                on: {
                  VERIFY: { target: ".verifying" },
                  SET: { target: ".checking", actions: ["setModel"] },
                  CANCEL: { target: ".checking" }
                }
              },
              // Resend cooldown — gates re-calling the resend service. Runs
              // alongside the form; RESEND is only accepted in `available`, so
              // it can't be fired again until the cooldown returns us there.
              resend: {
                initial: "available",
                states: {
                  available: { on: { RESEND: "processing" } },
                  processing: {
                    invoke: {
                      src: "sendVerificationEmail",
                      onDone: "complete",
                      onError: { target: "error", actions: ["setError"] }
                    }
                  },
                  complete: { after: { cooldown: "available" } },
                  error: { after: { cooldown: "available" } }
                }
              }
            }
          },

          verified: {
            id: "verified"
          }
        }
      },

      // Handle completion, stop the machine and prevent further requests
      complete: {
        id: "complete",
        type: "final"
      }
    },
    on: {
      AUTHENTICATED: { target: "#subscribing" },
      UNAUTHENTICATED: { target: "#subscribing" },
      REFRESH: { target: "#subscribing" }
    }
  },
  {
    actions: {
      // ---
      setAuthHelper: assign({
        authHelper: ({ authHelper }: ClientContext) =>
          authHelper ?? spawn(authSubscription)
      }),
      // ---
      setError: assign({
        error: (_context, { data }: AnyEventObject) => {
          const error = mapToHeadlessError(data);
          // Surface AJV/server validation errors as `error.data` so the form
          // shows them inline (mirrors the guest machine's setError).
          if (error?.status == responseCodes.Unprocessable_Entity) {
            error.data = useValidationParser(error);
          }

          return error;
        }
      }),
      setVerificationError: assign({
        error: (_context, { data }: AnyEventObject) => {
          const error = mapToHeadlessError(data);

          error!.data = parseError(error!.message, "code");

          return error;
        }
      }),

      // Set client from REFRESH event (late user data load)
      setClient: assign({
        client: (_context, { client }: AnyEventObject) => client
      }),

      // --- guest-client form actions (upgrade + email)
      // Runs as `checking`'s entry. Only assigns on a SET event so non-SET
      // entries (initial load, whose event carries `customFields`/schema data)
      // don't clobber the parser-set model.
      setModel: assign({
        model: ({ model }: ClientContext, event: AnyEventObject) =>
          event.type === "SET" ? event.data : model
      }),
      setCustomFields: assign({
        customFields: (_context, { data }: AnyEventObject) => data
      }),
      setRegisterSchemas: assign({
        formType: () => ClientFormType.REGISTER,
        schema: ({ customFields }: ClientContext) =>
          useRegisterSchema(customFields),
        uischema: ({ customFields }: ClientContext) =>
          useRegisterUischema(customFields),
        // Seed the register form's `username` from the guest client's saved
        // email (the BE keeps it in `username`); the parse service shapes the
        // rest against the schema.
        model: ({ model, client }: ClientContext): RegisterModel => ({
          ...(model as RegisterModel),
          username:
            (model as RegisterModel)?.username ??
            client?.email ??
            client?.username
        })
      }),
      setEmailSchemas: assign({
        formType: () => ClientFormType.EMAIL,
        schema: () => useGuestEmailSchemaParser(),
        uischema: () => useGuestEmailUischemaParser(),
        // Seed the email from the saved value (the BE keeps a guest's email in
        // `username`); the parse service shapes it against the schema.
        model: ({ client, model }: ClientContext) => ({
          ...(model as GuestEmailModel),
          email:
            (model as GuestEmailModel)?.email ??
            client?.email ??
            client?.username
        })
      }),
      // Reflect the just-saved email on the client so the machine's `client`
      // updates in-session (the PUT itself returns `email: null` for a guest —
      // the value lives in `username`).
      setClientEmail: assign({
        client: ({ client, model }: ClientContext) =>
          client
            ? {
                ...client,
                username: (model as GuestEmailModel)?.email ?? client.username
              }
            : client
      }),

      setFeedbackError: ({ error }, _event) => {
        const { t } = useI18n();

        if (!error || error?.status == responseCodes.Unprocessable_Entity)
          return;

        useFeedback().addError({
          title: t("error.request_process_failed"),
          copy: error?.message,
          data: error?.data
        });
      },

      markEmailVerified: assign({
        client: ({ client }) =>
          client?.primaryEmail
            ? {
                ...client,
                primaryEmail: { ...client.primaryEmail, isVerified: true }
              }
            : client
      }),

      setVerifyEmailSchemas: assign({
        schema: () => useVerifyEmailSchemaParser(),
        uischema: () => useVerifyEmailUischemaParser(),
        model: () => ({})
      }),

      clearError: assign({ error: undefined })
    },
    guards: {
      // Context guard: the scoped factory seeds `scopeActor` + `client` at
      // construction. No store read inside the machine.
      isClient: ({ scopeActor, client }: ClientContext) =>
        scopeActor === ScopeActorTypes.CLIENT && !!client,
      isUnverified: ({ client }: ClientContext) =>
        !!useBrand().enforceEmailVerification.value &&
        !client?.primaryEmail?.isVerified,
      isGuestClient: ({ client }: ClientContext) => !!client?.isGuest,
      isRegisterForm: ({ formType }: ClientContext) =>
        formType === ClientFormType.REGISTER,
      isEmailForm: ({ formType }: ClientContext) =>
        formType === ClientFormType.EMAIL
    },

    delays: {
      error: () => useTime().ERROR,
      expired: () => useTime().MINUTE * 5,
      cooldown: () => useTime().SECOND * 15
    },
    services
  }
);
