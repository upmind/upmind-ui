// --- external
import { createMachine, assign } from "xstate";

// --- internal
import { useI18n, useLocale } from "../../system";
import services from "./services";

import type { ClientContext } from "./types";

import { useDataLayer } from "../../system";
const { dataLayer } = useDataLayer();

import { useFeedback } from "../../feedback";
const { addError } = useFeedback();

// --- utils
import { omit } from "lodash-es";
import {
  useTime,
  useCookies,
  mapToHeadlessError,
  DetailedError,
  ErrorOrigin
} from "../../../utils";
const { removeTopLevel: removeCookie, setTopLevel: setCookie } = useCookies();
import { useClientParser } from "../utils";

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
        always: {
          target: "available",
          cond: "hasClient"
        },
        invoke: {
          src: "load",
          onDone: {
            target: "available",
            actions: ["setActor", "setClient", "setLocale"]
          },
          onError: { target: "error", actions: ["setError"] }
        },
        after: {
          timeout: {
            target: "error",
            actions: [
              assign({
                error: () =>
                  mapToHeadlessError(
                    new DetailedError(
                      "Loading user profile timed out",
                      responseCodes.Timeout,
                      ErrorOrigin.Headless
                    )
                  )
              })
            ]
          }
        }
      },

      error: {
        after: {
          error: {
            actions: [
              () => {
                console.warn("[Client Machine] load failed, triggering reauth");
              },
              "reauth"
            ]
          }
        },
        on: {
          REFRESH: "loading"
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
          REFRESH: {
            target: "loading",
            actions: "clearError"
          },
          LOGOUT: {
            target: "complete",
            actions: "clear"
          },
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
    }
  },
  {
    actions: {
      clear: assign((_context, _event) => {
        // clear all session data, including cookies and local storage
        //  also update the data layer to indicate the client has logged out
        sessionStorage.clear();
        removeCookie("upm_client_session");
        removeCookie("upm_admin_session");
        removeCookie("upm_user_session");
        removeCookie("upm_guest_session");
        removeCookie("upm_actor");
        dataLayer().withUser().push(false);
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
          useClientParser(data.actor)
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

        addError({
          title: t("error.request_process_failed"),
          copy: error?.message,
          data: error?.data
        });
      },

      clearError: assign({ error: undefined }),
      reauth: (
        context: ClientContext,
        event: AnyEventObject,
        { action, ...meta }: any
      ) => {
        // Send EXPIRED to parent session machine
        if (meta?._service?.parent) {
          meta._service.parent.send({ type: "EXPIRED" });
        }
      }
    },
    guards: {
      hasClient: (context: ClientContext) => !!context?.client
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
      expired: () => useTime().MINUTE * 5,
      timeout: () => useTime().SECOND * 15
    },
    services: services as any
  }
);
