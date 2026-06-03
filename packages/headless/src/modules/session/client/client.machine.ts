// --- external
import { createMachine, assign } from "xstate";

// --- internal
import { useI18n, useLocale } from "../../system";
import services from "./services";

import type { ClientContext, GuestEmailModel } from "./types";
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
  useGuestEmailModelParser
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

      processed: {
        id: "processed",
        after: {
          wait: "available"
        }
      },

      available: {
        id: "available",
        initial: "checking",
        states: {
          // Routes the loaded client into either `unregistered` (guest customer)
          // or `registered` (full client) based on context.client.isGuest. The
          // sub-states gate which events are valid (e.g. only guests can
          // COMPLETE_REGISTRATION; only full clients can TRANSFER_TO).
          checking: {
            always: [
              { target: "unregistered", cond: "isGuestClient" },
              { target: "registered" }
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

              register: {
                id: "guestUpgrade",
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
                        target: "available",
                        actions: ["setRegisterSchemas"]
                      }
                    }
                  },
                  available: {
                    initial: "checking",
                    states: {
                      checking: {
                        // Model is set here (from the SET event), not on the SET
                        // transition — mirrors the dataManager/billing form shape.
                        entry: ["setModel"],
                        invoke: {
                          src: "validate",
                          onDone: { target: "valid", actions: ["clearError"] },
                          onError: { target: "invalid", actions: ["setError"] }
                        }
                      },
                      // Commit only from `valid` — an invalid/partial form can't
                      // submit.
                      valid: {
                        on: {
                          COMPLETE_REGISTRATION: {
                            target: "#processing.registering"
                          }
                        }
                      },
                      invalid: {}
                    },
                    on: {
                      SET: { target: ".checking" }
                    }
                  },
                  error: {
                    on: {
                      SET: { target: "available" }
                    }
                  }
                }
              },

              email: {
                id: "guestEmail",
                initial: "loading",
                states: {
                  loading: {
                    always: {
                      target: "available",
                      actions: ["setEmailSchemas"]
                    }
                  },
                  available: {
                    initial: "checking",
                    states: {
                      checking: {
                        // Model is set here (from the SET event), not on the SET
                        // transition — mirrors the dataManager/billing form shape.
                        entry: ["setModel"],
                        invoke: {
                          src: "validate",
                          onDone: { target: "valid", actions: ["clearError"] },
                          onError: { target: "invalid", actions: ["setError"] }
                        }
                      },
                      // Save only from `valid` — a partial/invalid email can't
                      // autosave.
                      valid: {
                        on: {
                          UPDATE_GUEST_EMAIL: { target: "updating" }
                        }
                      },
                      invalid: {},
                      // The background save lives *inside* `available`, so the form
                      // stays mounted/usable while saving AND the client never
                      // leaves top-level `available`. Leaving it would drop
                      // `hasSession` in the auth subscription, making a background
                      // email save look like a re-auth and needlessly re-sync the
                      // basket and the other auth consumers.
                      updating: {
                        invoke: {
                          src: "updateGuestEmail",
                          onDone: {
                            target: "valid",
                            actions: ["clearError", "setClientEmail"]
                          },
                          onError: { target: "invalid", actions: ["setError"] }
                        }
                      }
                    },
                    on: {
                      SET: { target: ".checking" }
                    }
                  }
                }
              }
            },
            on: {
              REGISTER: { target: ".register" },
              EMAIL: { target: ".email" },
              LOGOUT: {
                target: "#complete",
                actions: "clear"
              },
              REFRESH: {
                target: "#loading"
              }
            }
          },

          registered: {
            id: "registered",
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

      processing: {
        id: "processing",
        initial: "registering",
        states: {
          registering: {
            invoke: {
              src: "completeRegistration",
              // Success re-fetches `/self` (is_guest:false) → full client.
              onDone: {
                target: "#loading",
                actions: ["setFeedbackSuccess"]
              },
              // Failure returns to the upgrade form's error state so the form
              // and the server error stay visible for retry.
              onError: {
                target: "#guestUpgrade.error",
                actions: ["setError", "setFeedbackError"]
              }
            }
          }
          // NOTE: the guest-email autosave does NOT live here. It's a background
          // field update handled within `#guestEmail.available.updating`, so the
          // client never leaves top-level `available` for it (see auth helper).
          // Top-level `processing` is reserved for the upgrade (identity change),
          // which *should* re-auth and re-sync downstream consumers.
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
        client: (_context, { data }: AnyEventObject) =>
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
          )
      }),
      setEmailSchemas: assign({
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

      setFeedbackSuccess: (_context, _event) => {
        const { t } = useI18n();
        useFeedback().addSuccess(t("confirm.registration_complete"));
      },

      clearError: assign({ error: undefined })
    },
    guards: {
      isGuestClient: ({ client }: ClientContext) => !!client?.isGuest
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
      expired: () => useTime().MINUTE * 5
    },
    services: services as any
  }
);
