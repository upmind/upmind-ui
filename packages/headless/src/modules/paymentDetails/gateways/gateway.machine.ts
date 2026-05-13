// --- external
import { createMachine, assign, spawn, sendParent } from "xstate";

// --- internal
import services from "./services";
import { useI18n } from "../../system";
import { useFeedback } from "../../feedback";
import { useSchema, useUischema } from "./schemas";

// --- utils
import { useTime } from "../../../utils";
import {
  useValidationParser,
  useModelParser,
  mapToHeadlessError,
  responseCodes
} from "../../../utils";
import { isArray, isEmpty, isNil } from "lodash-es";

// --- types
import type { AnyEventObject } from "xstate";
import { type GatewayContext } from "./types";
import {
  type GatewayData,
  GatewayContext as GatewayCtx
} from "@upmind-automation/types";

// -----------------------------------------------------------------------------
// override the macine actions to generate the schema, uischema and model

// -----------------------------------------------------------------------------

export default <T = unknown>(name: string) =>
  createMachine<GatewayContext<T>, AnyEventObject>(
    {
      //tsTypes: {} as import("./gateway.machine.typegen").Typegen0,
      id: name,
      predictableActionArguments: true,
      initial: "loading",
      context: {} as GatewayContext<T>,
      states: {
        loading: {
          id: "loading",
          entry: ["clearModel"],
          invoke: {
            src: "load",
            onDone: [
              {
                target: "#available",
                cond: "hasRendered",
                actions: ["setContext", "setSchemas"]
              },
              {
                target: "rendering",
                actions: ["setContext", "setSchemas"]
              }
            ],
            onError: {
              target: "unavailable",
              actions: ["setError"]
            }
          }
        },

        rendering: {
          id: "rendering",
          initial: "idle",
          states: {
            idle: {
              on: {
                RENDER: { target: "processing" }
              }
            },
            processing: {
              invoke: {
                src: "render",
                onDone: {
                  target: "processed",
                  actions: ["setSdk"]
                },
                onError: {
                  target: "#unavailable",
                  actions: ["setError"]
                }
              }
            },
            processed: {
              after: { wait: "#available" }
            }
          }
        },

        // ---

        available: {
          id: "available",
          initial: "checking",

          states: {
            checking: {
              id: "checking",
              initial: "parsing",
              states: {
                parsing: {
                  invoke: {
                    src: "parse",
                    onDone: {
                      target: "validating",
                      actions: ["setContext", "setSchemas", "setModel"]
                    },
                    onError: {
                      target: "#invalid",
                      actions: ["setError"]
                    }
                  }
                },
                validating: {
                  invoke: {
                    src: "validate",
                    onDone: { target: "#valid", actions: ["clearError"] },
                    onError: {
                      target: "#invalid",
                      actions: ["setError"]
                    }
                  }
                }
              }
            },

            invalid: { id: "invalid" },

            valid: {
              id: "valid",
              // NB: Notify the parent to re-validate when the gateway becomes valid.
              //     After a failed payment the parent lands in `invalid` (because the
              //     gateway was in `available.error`). When the user fixes input and the
              //     gateway recovers to `valid`, the parent needs to re-check so it can
              //     also transition back to `valid` and accept PAY again.
              entry: sendParent(() => ({ type: "SET" })),
              on: {
                PAY: { target: "#processing.payment", cond: "isPaying" },
                ADD: { target: "#processing.adding", cond: "isAdding" }
              }
            },

            error: {
              id: "error"
            }
          },
          on: {
            REFRESH: {
              target: "available.checking",
              actions: ["setContext", "updateSdk"],
              cond: "hasChanged"
            },
            CLEAR: {
              target: "available.checking",
              actions: ["clearModel"]
            },
            SET: {
              target: "available.checking",
              actions: ["clearError", "setModel"]
            },
            VALIDATE: {
              actions: ["setErrorSDK"],
              target: "available.checking.validating"
            }
          }
        },

        processing: {
          id: "processing",
          entry: ["clearError"],
          states: {
            payment: {
              invoke: {
                src: "pay",
                onDone: {
                  target: "#processed",
                  actions: ["setPaymentDetails", "providePaymentDetails"]
                },
                onError: [
                  {
                    target: "#checking",
                    actions: ["cancelPaymentDetails"],
                    cond: "noErrorProvided"
                  },
                  {
                    target: "#error",
                    actions: ["setError", "cancelPaymentDetails"]
                  }
                ]
              }
            },
            adding: {
              invoke: {
                src: "add",
                onDone: {
                  target: "#processed",
                  actions: ["setPaymentDetails", "providePaymentDetails"]
                },
                onError: [
                  {
                    target: "#checking",
                    actions: ["cancelPaymentDetails"],
                    cond: "noErrorProvided"
                  },
                  {
                    target: "#error",
                    actions: ["setError", "cancelPaymentDetails"]
                  }
                ]
              }
            }
          },
          on: { VALIDATE: { actions: [] /*do nothing*/ } }
        },

        processed: {
          id: "processed",
          after: {
            wait: {
              target: "#complete",
              cond: "hasNoOutstandingBalance"
            }
          },
          on: { VALIDATE: { actions: [] /*do nothing*/ } }
        },

        unavailable: {
          id: "unavailable",
          entry: ["cleanupSdk"],
          // NB: allow recovery when the parent supplies a changed payload
          // (e.g. user lifts the payment amount above Stripe's minimum after
          // an `amount_too_small` loaderror). `clearSdk` is required so
          // `hasRendered` evaluates false on the next `load.onDone` and the
          // machine routes through `rendering` to mount a fresh element.
          on: {
            REFRESH: {
              target: "loading",
              actions: ["clearSdk", "setContext", "clearError"],
              cond: "hasChanged"
            }
          }
        },

        complete: {
          type: "final",
          id: "complete",
          entry: ["cleanupSdk"],
          data: ({ paymentDetail }: GatewayContext, _event: AnyEventObject) =>
            paymentDetail
        }
      },
      on: {
        CLEANUP: {
          actions: ["cleanupSdk"]
        },
        UNAUTHENTICATED: {
          target: "loading",
          actions: ["clearError", "clearModel", "clearSchemas"]
        }
      }
    },
    {
      actions: {
        setContext: assign(
          (_context: GatewayContext<any>, { data }: AnyEventObject) => data
        ),

        // ---
        setSchemas: assign({
          schema: (context: GatewayContext<any>) => useSchema(context),
          uischema: (context: GatewayContext<any>) => useUischema(context)
        }),

        clearSchemas: assign({
          schema: undefined,
          uischema: undefined
        }),

        // NB: `cleanupSdk` already drops the entire `sdk` wrapper, but the
        // render-time scaffolding (`container`, `validationHelper`,
        // `validationObserver`) lives outside `sdk` and must be cleared
        // separately so the next `load.onDone` routes through `rendering` with
        // a clean slate and triggers a fresh `mount()`.
        clearSdk: assign({
          sdk: undefined,
          container: undefined,
          validationHelper: undefined,
          validationObserver: undefined
        }),

        setModel: assign({
          model: (
            { schema, model }: GatewayContext<any>,
            { data }: AnyEventObject
          ) => {
            if (!schema) return data ?? model;
            return useModelParser<GatewayData>(schema, data ?? model);
          }
        }),

        clearModel: assign({
          model: undefined
        }),

        setSdk: assign({
          sdk: ({ sdk }: GatewayContext<any>, { data }: AnyEventObject) =>
            data?.sdk ?? sdk, // some gateways return sdk on render so we need to update it if needed
          container: (
            _context: GatewayContext<any>,
            { data }: AnyEventObject
          ) => data.container,
          validationHelper: (
            _context: GatewayContext<any>,
            { data }: AnyEventObject
          ) => data.validationHelper,
          validationObserver: (
            { validationObserver }: GatewayContext<any>,
            { data }: AnyEventObject
          ) => {
            return (
              validationObserver ??
              (data.validationHelper ? spawn(data.validationHelper) : undefined)
            );
          }
        }),

        // ---

        updateSdk: (_context: GatewayContext<any>, _event: AnyEventObject) => {
          //  do nothing for generic gateway
        },

        // ---
        setPaymentDetails: assign({
          paymentDetail: (
            _context: GatewayContext<any>,
            { data }: AnyEventObject
          ) => data
        }),

        providePaymentDetails: sendParent(
          ({ paymentDetail }: GatewayContext<any>, _event: AnyEventObject) => ({
            type: "PAYMENT_DETAILS",
            data: paymentDetail
          })
        ),

        cancelPaymentDetails: sendParent(() => ({
          type: "CANCEL"
        })),

        // ---
        setFeedbackError: (
          { error }: GatewayContext<any>,
          _event: AnyEventObject
        ) => {
          const { t } = useI18n();

          if (
            !error ||
            isArray(error) ||
            error?.status == responseCodes.Unprocessable_Entity ||
            error.code == responseCodes.Unprocessable_Entity
          )
            return;
          useFeedback().addError({
            title: t("error.payment_process_failed"),
            copy: error?.message,
            data: error?.data
          });

          // escalate({ data: error });
        },

        setError: assign({
          error: (_context: GatewayContext<any>, { data }: AnyEventObject) => {
            let error = mapToHeadlessError(data);
            if (error?.status == responseCodes.Unprocessable_Entity) {
              error.data = useValidationParser(error);
            }
            return error;
          }
        }),

        setErrorSDK: assign({
          error: ({ error }: GatewayContext<any>, { data }: AnyEventObject) =>
            error // do nothing by default.... individual sdk gateways can override
        }),

        cleanupSdk: assign({
          sdk: undefined
        }),

        clearError: assign({
          error: undefined
        })
      },
      guards: {
        hasChanged: (
          { orderId, currency, amount, address }: GatewayContext,
          { data }: AnyEventObject
        ) =>
          amount !== data.amount ||
          orderId !== data.orderId ||
          currency?.id !== data.currency?.id ||
          address?.id !== data.address?.id,

        hasNoOutstandingBalance: (
          _context: GatewayContext,
          _event: AnyEventObject
        ) => {
          // TODO: check if there is an outstanding balance
          return true;
        },
        hasRendered: (
          { sdk, renderless }: GatewayContext,
          _event: AnyEventObject
        ) => {
          return renderless || !isNil(sdk);
        },

        noErrorProvided: (_context: GatewayContext, { data }: AnyEventObject) =>
          isEmpty(data),

        isAdding: ({ ctx }: GatewayContext, _event: AnyEventObject) =>
          ctx == GatewayCtx.ADD,

        isPaying: ({ ctx }: GatewayContext, _event: AnyEventObject) =>
          ctx == GatewayCtx.PAY
      },
      delays: {
        error: () => useTime().ERROR,
        wait: () => useTime().WAIT
      },
      services
    }
  );
