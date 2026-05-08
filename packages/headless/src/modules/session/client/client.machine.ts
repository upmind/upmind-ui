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
          checking: {
            always: [
              { target: "unregistered", cond: "isGuestClient" },
              { target: "registered" }
            ]
          },

          unregistered: {
            id: "unregistered",
            on: {
              COMPLETE_REGISTRATION: {
                target: "#processing.registering"
              },
              UPDATE_GUEST_EMAIL: {
                target: "#processing.updating"
              },
              LOGOUT: {
                target: "complete",
                actions: "clear"
              },
              REFRESH: {
                target: "loading"
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
                target: "complete",
                actions: "clear"
              },
              REFRESH: {
                target: "loading"
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
              onDone: {
                target: "#loading",
                actions: ["setFeedbackSuccess"]
              },
              onError: {
                target: "#available",
                actions: ["setError", "setFeedbackError"]
              }
            }
          },

          updating: {
            invoke: {
              src: "updateGuestEmail",
              onDone: {
                target: "#available"
              },
              onError: {
                target: "#available",
                actions: ["setError"]
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
