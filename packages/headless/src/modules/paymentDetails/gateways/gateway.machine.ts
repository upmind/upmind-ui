// --- external
import { createMachine, assign, sendParent, pure } from "xstate";

// --- internal
import services from "./card/services";
import { useI18n } from "../../system";
import { useFeedback } from "../../feedback";
const { addError } = useFeedback();

// --- utils
import {
  mapToHeadlessError,
  useModelParser,
  useTime,
  useValidationParser
} from "../../../utils";
import { isArray } from "xstate/lib/utils";
import { responseCodes } from "../../../utils";
import { useSchema, useUischema } from "./schemas";

// --- types
import type { AnyEventObject } from "xstate";
import {
  GatewayContext as GatewayCtx,
  GatewayData
} from "@upmind-automation/types";
import { type GatewayContext } from "./types";
import { isFunction } from "lodash-es";

// -----------------------------------------------------------------------------
export default createMachine<GatewayContext, AnyEventObject>(
  {
    //tsTypes: {} as import("./gateway.machine.typegen").Typegen0,
    id: "gateway",
    predictableActionArguments: true,
    initial: "loading",
    context: {} as GatewayContext,
    states: {
      loading: {
        entry: ["clearModel"],
        invoke: {
          src: "load",
          onDone: {
            target: "available",
            actions: ["setContext", "setSchemas"]
          },
          onError: {
            target: "unavailable",
            actions: ["setError", "setFeedbackError"]
          }
        }
      },

      // ---
      available: {
        id: "available",
        initial: "rendering",
        states: {
          rendering: {
            always: {
              target: "checking",
              cond: "isRenderless"
            },
            on: {
              RENDER: {
                target: "checking",
                actions: ["render", "clearRenderer"]
              }
            }
          },

          checking: {
            id: "checking",
            entry: ["clearError"],
            initial: "parsing",
            states: {
              parsing: {
                invoke: {
                  src: "parse",
                  onDone: {
                    target: "validating",
                    actions: ["setSchemas", "setModel"]
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
                  onDone: { target: "#valid" },
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
            on: {
              CHECKOUT: "processing",
              PAY: "processing"
            }
          },

          processing: {
            entry: ["clearError"],
            invoke: {
              src: "pay",
              onDone: {
                target: "#processed",
                actions: ["setPaymentDetails", "providePaymentDetails"]
              },
              onError: {
                target: "#error",
                actions: [
                  "setError",
                  "setFeedbackError",
                  "cancelPaymentDetails"
                ]
              }
            }
          },

          processed: {
            id: "processed",
            after: {
              wait: {
                target: "#complete",
                cond: "hasNoOutstandingBalance"
              }
            }
          },

          error: {
            id: "error"
          }
        },
        on: {
          CLEAR: {
            target: "available.checking",
            actions: ["clearModel"]
          },
          SET: {
            target: "available.checking",
            actions: ["setModel"]
          },
          VALIDATE: {
            target: "available.checking.validating",
            actions: ["setElementStatus"]
          }
        }
      },

      unavailable: {
        id: "unavailable"
      },

      complete: {
        id: "complete",
        data: ({ paymentDetails }: GatewayContext, _event: AnyEventObject) =>
          paymentDetails
      }
    },
    on: {
      REFRESH: {
        target: "available.checking",
        actions: ["setContext"],
        cond: "hasChanged"
      },
      UNAUTHENTICATED: {
        target: "loading",
        actions: ["clearError", "clearModel", "clearSchemas"]
      }
    }
  },
  {
    actions: {
      render: pure(({ renderer }: GatewayContext, { data }: AnyEventObject) => {
        return () => {
          if (renderer) renderer(data?.container);
        };
      }),

      clearRenderer: assign({
        renderer: undefined
      }),
      setContext: assign(
        (_context: GatewayContext, { data }: AnyEventObject) => data
      ),

      // ---
      setSchemas: assign({
        schema: context => useSchema(context),
        uischema: context => useUischema(context)
      }),

      clearSchemas: assign({
        schema: undefined,
        uischema: undefined
      }),

      setModel: assign({
        model: (
          { schema, model }: GatewayContext,
          { data }: AnyEventObject
        ) => {
          if (!schema) return data ?? model;
          return useModelParser<GatewayData>(schema, data ?? model);
        }
      }),

      clearModel: assign({
        model: undefined
      }),

      // ---
      setPaymentDetails: assign({
        paymentDetails: (
          _context: GatewayContext,
          { data }: AnyEventObject
        ) => {
          return data;
        }
      }),

      providePaymentDetails: sendParent(({ paymentDetails }) => ({
        type: "PAYMENT_DETAILS",
        data: paymentDetails
      })),

      cancelPaymentDetails: sendParent(() => ({
        type: "CANCEL"
      })),

      // ---
      setFeedbackError: ({ error }: GatewayContext, _event: AnyEventObject) => {
        const { t } = useI18n();

        if (
          !error ||
          isArray(error) ||
          error?.status == responseCodes.Unprocessable_Entity ||
          error.code == responseCodes.Unprocessable_Entity
        )
          return;
        addError({
          title: t("error.payment_process_failed"),
          copy: error?.message,
          data: error?.data
        });

        // escalate({ data: error });
      },

      setError: assign({
        error: (_context: GatewayContext, { data }: AnyEventObject) => {
          let error = mapToHeadlessError(data);

          if (error?.status == responseCodes.Unprocessable_Entity) {
            error.data = useValidationParser(error);
          }
          return error;
        }
      }),

      clearError: assign({ error: undefined })
    },

    guards: {
      hasChanged: (
        { orderId, currency, amount }: GatewayContext,
        { data }: AnyEventObject
      ) => {
        const value =
          orderId !== data.orderId ||
          currency !== data.currency ||
          amount !== data.amount;
        return value;
      },

      isRenderless: (
        { renderer, renderless }: GatewayContext,
        _event: AnyEventObject
      ) => renderless || !isFunction(renderer),
      hasNoOutstandingBalance: (
        _context: GatewayContext,
        _event: AnyEventObject
      ) => {
        // TODO: check if there is an outstanding balance
        return true;
      },

      isAdding: ({ ctx }: GatewayContext, _event: AnyEventObject) => {
        return ctx !== undefined && ctx == GatewayCtx.ADD;
      },
      isPaying: ({ ctx }: GatewayContext, _event: AnyEventObject) => {
        return ctx !== undefined && ctx == GatewayCtx.PAY;
      }
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services: services as any // to compensate for different signatures from the gateways
  }
);
