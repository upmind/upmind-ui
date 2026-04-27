// --- external
import { createMachine, assign } from "xstate";

// --- internal
import { useI18n, useLocale } from "../../system";
import services from "./services";

import type { ClientContext } from "./types";

import { useDataLayer } from "../../system";

import { useFeedback } from "../../feedback";

// --- utils
import { omit } from "lodash-es";
import { useTime, useCookies, mapToHeadlessError } from "../../../utils";
const { removeTopLevel: removeCookie, setTopLevel: setCookie } = useCookies();
import { mapClient } from "../utils";

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
          onDone: [
            {
              cond: "requiresEmailVerification",
              target: "unverified",
              actions: ["setActor", "setClient", "setLocale"]
            },
            {
              target: "available",
              actions: ["setActor", "setClient", "setLocale"]
            }
          ],
          onError: { target: "complete", actions: ["setError"] }
        }
      },

      unverified: {
        id: "unverified",
        initial: "idle",
        states: {
          idle: {
            on: {
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

      processed: {
        id: "processed",
        after: {
          wait: "available"
        }
      },

      available: {
        id: "available",
        on: {
          TRANSFER_TO: {
            target: "transferring"
          }
        }
      },

      transferring: {
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
        error: (context, { data }: AnyEventObject) => mapToHeadlessError(data)
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

      clearError: assign({ error: undefined })
    },
    guards: {
      requiresEmailVerification: (_context, { data }: AnyEventObject) => {
        // `data` is the resolved `load` payload:
        // { actor: IClient, accounts: IAccount[], enforceEmailVerification }
        // Reading from event data (not via useBrand()) avoids a top-level
        // circular import between client.machine and the brand module.
        if (!data?.enforceEmailVerification) return false;
        return !data?.actor?.default_email?.verified;
      }
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
      expired: () => useTime().MINUTE * 5
    },
    services: services as any
  }
);
