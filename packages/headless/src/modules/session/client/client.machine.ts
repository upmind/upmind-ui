// --- external
import { createMachine, assign } from "xstate";

// --- internal
import { useI18n, useLocale } from "../../system";
import { useBrand } from "../../brand";
import services from "./services";

import type { ClientContext, GuestEmailModel } from "./types";
import { ClientFormType } from "./types";
import type { RegisterModel } from "../guest/types";

import { useDataLayer } from "../../system";

import { useFeedback } from "../../feedback";

// --- utils
import { omit } from "lodash-es";
import {
  useTime,
  useCookies,
  mapToHeadlessError,
  useValidationParser
} from "../../../utils";
const { removeTopLevel: removeCookie, setTopLevel: setCookie } = useCookies();
import { mapClient } from "../utils";
import {
  useRegisterSchemaParser,
  useRegisterUischemaParser,
  useRegisterModelParser
} from "../guest/utils";
import {
  useGuestEmailSchemaParser,
  useGuestEmailUischemaParser,
  useGuestEmailModelParser,
  useVerifyEmailSchemaParser,
  useVerifyEmailUischemaParser
} from "./utils";

// --- types
import { responseCodes } from "../../../utils";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    //tsTypes: {} as import("./client.machine.typegen").Typegen0,
    id: "sessionClient",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      client: undefined,
      transfer: undefined,
      // ---
      error: undefined
    } as ClientContext,
    states: {
      loading: {
        id: "loading",
        entry: "clearError",
        invoke: {
          src: "load",
          onDone: {
            target: "available",
            actions: ["setActor", "setClient", "setLocale"]
          },
          onError: { target: "complete", actions: ["setError"] }
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
              { target: "unregistered", cond: "isGuestClient" },
              { target: "unverified", cond: "isUnverified" },
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
            initial: "idle",
            states: {
              idle: {},

              // Register-form schema fetch (custom fields). Email form needs no
              // load — EMAIL sets its schema synchronously on the transition.
              loading: {
                invoke: {
                  src: "getCustomFields",
                  onDone: {
                    target: "available",
                    actions: ["setCustomFields", "setRegisterSchemas"]
                  },
                  onError: {
                    target: "available",
                    actions: ["setRegisterSchemas"]
                  }
                }
              },

              // The shared form surface. `formType` (set by REGISTER/EMAIL) says
              // whether it's hosting the upgrade or the checkout-email form.
              available: {
                initial: "checking",
                states: {
                  checking: {
                    // Set model on entry (no `parse` service); guarded to SET.
                    entry: ["setModel"],
                    invoke: {
                      src: "validate",
                      onDone: { target: "valid", actions: ["clearError"] },
                      onError: { target: "invalid", actions: ["setError"] }
                    }
                  },
                  valid: {
                    on: {
                      COMPLETE_REGISTRATION: {
                        target: "#unregistered.registering",
                        cond: "isRegisterForm"
                      },
                      UPDATE_GUEST_EMAIL: {
                        target: "#unregistered.updating",
                        cond: "isEmailForm"
                      }
                    }
                  },
                  invalid: {}
                },
                on: {
                  SET: { target: ".checking" }
                }
              },

              // Upgrade submit. `registering`/`updating`/`error` are siblings of
              // the form, so they don't inherit `available`'s SET handler — the
              // form can't be re-edited while a request is in flight.
              registering: {
                invoke: {
                  src: "completeRegistration",
                  onDone: {
                    target: "#loading"
                  },
                  onError: {
                    target: "error",
                    actions: ["setError", "setFeedbackError"]
                  }
                }
              },

              // Email autosave.
              updating: {
                invoke: {
                  src: "updateGuestEmail",
                  onDone: {
                    target: "available.valid",
                    actions: ["clearError", "setClientEmail"]
                  },
                  onError: { target: "error", actions: ["setError"] }
                }
              },

              // Submit failure (drives the alert); distinct from `invalid`
              // (client validation).
              error: {
                on: {
                  SET: { target: "available" }
                }
              }
            },
            on: {
              REGISTER: { target: ".loading" },
              EMAIL: {
                target: ".available",
                actions: ["setEmailSchemas"]
              },
              LOGOUT: {
                target: "#complete",
                actions: "clear"
              },
              REFRESH: {
                target: "#loading"
              }
            }
          },

          // Full client owing email verification. Hosts the verify-email form
          // (idle/verifying). On success it re-enters `#available` → `checking`,
          // which — the email now verified — routes to `verified`.
          unverified: {
            id: "unverified",
            initial: "idle",
            entry: "setVerifyEmailSchemas",
            states: {
              idle: {
                on: {
                  SET: { actions: ["setModel"] },
                  VERIFY: {
                    target: "verifying",
                    actions: ["clearError"]
                  },
                  CANCEL: { target: "#loading" }
                }
              },
              verifying: {
                invoke: {
                  src: "verifyEmailCode",
                  onDone: {
                    // POST success is authoritative — flip the local flag and
                    // transition straight to `available`. Avoids a race where a
                    // fresh `/self` call could return stale `verified: 0`.
                    target: "#available",
                    actions: ["markEmailVerified", "notifyVerificationSuccess"]
                  },
                  onError: {
                    target: "idle",
                    actions: ["setError", "notifyVerificationFailure"]
                  }
                }
              }
            }
          },

          verified: {
            id: "verified",
            on: {
              TRANSFER_TO: {
                target: "#transferring"
              },
              LOGOUT: {
                target: "#complete",
                actions: "clear"
              },
              REFRESH: {
                target: "#loading"
              }
            }
          }
        }
      },

      transferring: {
        id: "transferring",
        initial: "processing",
        states: {
          processing: {
            invoke: {
              src: "transferTo",
              onDone: {
                target: "available",
                actions: "setTransfer"
              },
              onError: {
                target: "unavailable",
                actions: ["setError", "setFeedbackError"]
              }
            }
          },

          available: {
            after: {
              expired: {
                target: "unavailable",
                actions: "clearTransfer"
              }
            }
          },

          unavailable: {
            after: { error: "#available" }
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
      LOGOUT: { target: "#complete", actions: "clear" },
      REFRESH: { target: "#loading" }
    }
  },
  {
    actions: {
      clear: assign((_context, _event) => {
        // clear all session data, including cookies and local storage
        //  also update the data layer to indicate the client has logged out
        sessionStorage.clear();
        removeCookie("upm_client_session");
        removeCookie("upm_guest_session");
        removeCookie("upm_actor");
        useDataLayer().dataLayer().withUser().push(false);
        return {};
      }),
      // ---
      setActor: (_context, { data }: AnyEventObject) => {
        setCookie(
          "upm_actor",
          omit(data?.analytics, ["environment", "language", "version"]),
          {
            expires: "8h"
          }
        );
      },

      setClient: assign({
        client: (_context: ClientContext, { data }: AnyEventObject) =>
          mapClient(data.actor, data.accounts)
      }),
      setLocale: ({ client }) => {
        if (!client) return;
        const locale = client.locale;
        useLocale().setLocale(locale);
      },

      setTransfer: assign({
        transfer: (_context, { data }: AnyEventObject) => data
      }),
      clearTransfer: assign({ transfer: undefined }),
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
          useRegisterSchemaParser(customFields),
        uischema: ({ customFields }: ClientContext) =>
          useRegisterUischemaParser(customFields),
        // Pre-fill the email (the register form's `username` field) from the
        // guest client's saved email so an upgrading guest doesn't re-enter it.
        // The email lives in `client.username` (the BE leaves `email` null) —
        // same coalescing as the email form and `completeRegistration`.
        model: ({ customFields, model, client }: ClientContext) =>
          useRegisterModelParser(
            {
              ...(model as RegisterModel),
              username:
                (model as RegisterModel)?.username ??
                client?.email ??
                client?.username
            },
            customFields ?? []
          ) as any
      }),
      setEmailSchemas: assign({
        formType: () => ClientFormType.EMAIL,
        schema: () => useGuestEmailSchemaParser(),
        uischema: () => useGuestEmailUischemaParser(),
        // Pre-fill from the saved value. The BE stores a guest client's email in
        // `username` (it leaves `email` null), so fall back to it — mirrors
        // `completeRegistration`'s `email ?? username` coalescing. Without this
        // the field is blank on reload even after a successful save.
        model: ({ client, model }: ClientContext) =>
          useGuestEmailModelParser({
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

      notifyVerificationSuccess: (_context, _event) => {
        const { t } = useI18n();
        useFeedback().addSuccess(t("confirm.email_verified"));
      },

      notifyVerificationFailure: ({ error }, _event) => {
        const { t } = useI18n();
        useFeedback().addError({
          title: error?.message || t("error.client_email_verify_failed"),
          copy: error?.data ? undefined : error?.message,
          data: error?.data
        });
      },

      setVerifyEmailSchemas: assign({
        schema: () => useVerifyEmailSchemaParser(),
        uischema: () => useVerifyEmailUischemaParser()
      }),

      clearError: assign({ error: undefined })
    },
    guards: {
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
      wait: () => useTime().WAIT,
      expired: () => useTime().MINUTE * 5
    },
    services: services as any
  }
);
