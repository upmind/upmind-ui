// --- external
import type { AnyEventObject } from "xstate";
import { createMachine, assign, spawn, sendParent, pure } from "xstate";
import { filter, isString, includes, lowerCase, omit } from "lodash-es";

// --- internal
import services from "./services";
import { useFeedback } from "../../../feedback";
const { addError } = useFeedback();

// --- utils
import {
  useTime,
  useValidationParser,
  useModelParser,
  mapToHeadlessError,
  DetailedError,
  ErrorOrigin
} from "../../../../utils";
import { useSchema, useUischema } from "./schemas";
import { isFunction, isArray } from "lodash-es";

// --- types
import type { BraintreeContext } from "./types";
import { GatewayCtx } from "../types";
import { responseCodes } from "../../../../utils";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    //tsTypes: {} as import("./braintree.machine.typegen").Typegen0,
    id: "braintree",
    predictableActionArguments: true,
    initial: "loading",
    context: {} as BraintreeContext,
    states: {
      loading: {
        id: "loading",
        invoke: {
          src: "load",
          onDone: [
            {
              target: "#available",
              cond: "hasInstance",
              actions: ["setContext", "setSchemas"]
            },
            {
              target: "rendering",
              actions: ["setContext", "setSchemas"]
            }
          ],
          onError: {
            target: "unavailable",
            actions: ["setError", "setFeedbackError", "setSchemas"]
          }
        }
      },

      rendering: {
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
                target: "#available",
                actions: ["setContext", "setObserver"]
              },
              onError: {
                target: "#unavailable",
                actions: ["setError"]
              }
            }
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
            entry: ["clearError"],
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
              CHECKOUT: "processing.payment",
              PAY: "processing.payment",
              ADD: "processing.adding"
            }
          },

          processing: {
            entry: ["clearError"],
            states: {
              payment: {
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
              adding: {
                invoke: {
                  src: "add",
                  onDone: {
                    target: "#processed",
                    actions: ["set"]
                  }
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
            target: "available.checking.validating"
          }
        }
      },

      unavailable: {
        id: "unavailable"
      },

      complete: {
        id: "complete",
        data: ({ paymentDetails }: BraintreeContext, _event: AnyEventObject) =>
          paymentDetails
      }
    },
    on: {
      REFRESH: {
        target: "available.checking",
        actions: ["setContext", "updateBraintree"],
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
      setContext: assign(
        (_context: BraintreeContext, { data }: AnyEventObject) => data
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
          { schema, model }: BraintreeContext,
          { data }: AnyEventObject
        ) => {
          if (!schema) return data ?? model;
          return useModelParser(schema, data ?? model);
        }
      }),

      clearModel: assign({
        model: undefined
      }),

      setObserver: assign({
        validationObserver: (
          { braintreeHelper, validationObserver }: BraintreeContext,
          _event: AnyEventObject
        ) => {
          return (
            validationObserver ??
            (braintreeHelper ? spawn(braintreeHelper) : undefined)
          );
        }
      }),

      // ---

      updateBraintree: (
        { elements, element }: BraintreeContext,
        { data }: AnyEventObject
      ) => {
        if (!isFunction(elements?.update)) return; // in case we receive an update before braintree has loaded

        const amount = Math.round((data?.amount || 0) * 100); // NB: Braintree expects amount in cents
        if (amount <= 0) return; // NB: Braintree requires a positive amount

        elements.update({
          amount,
          currency: data?.currency.code.toLowerCase() // NB: MUST be lowercase
        });

        if (data.address) {
          element.update({
            defaultValues: {
              billingDetails: {
                address: {
                  postal_code: data.address?.postcode,
                  country: data.address?.country?.code
                }
              }
            }
          });
        }
      },

      // ---
      setPaymentDetails: assign({
        paymentDetails: (
          _context: BraintreeContext,
          { data }: AnyEventObject
        ) => data
      }),

      providePaymentDetails: sendParent(({ paymentDetails }) => ({
        type: "PAYMENT_DETAILS",
        data: paymentDetails
      })),

      cancelPaymentDetails: sendParent(() => ({
        type: "CANCEL"
      })),

      // ---
      setFeedbackError: (
        { error }: BraintreeContext,
        _event: AnyEventObject
      ) => {
        if (
          !error ||
          isArray(error) ||
          error?.status == responseCodes.Unprocessable_Entity ||
          error.code == responseCodes.Unprocessable_Entity
        )
          return;
        addError({
          title: "We experienced an error processing your payment details",
          copy: error?.message,
          data: error?.data
        });

        // escalate({ data: error });
      },

      setError: assign({
        error: (_context: BraintreeContext, { data }: AnyEventObject) => {
          const error = mapToHeadlessError(data);
          if (error?.status == responseCodes.Unprocessable_Entity) {
            error.data = useValidationParser(error);
          } else if (error?.data) {
            error.data = filter(
              error.data,
              e => isString(e.title) && !includes(lowerCase(e.title), "element")
            );
          }
          return error;
        }
      }),

      clearError: assign({ error: undefined })
    },

    guards: {
      hasChanged: (
        { orderId, currency, amount, address }: BraintreeContext,
        { data }: AnyEventObject
      ) => {
        const value =
          orderId !== data.orderId ||
          currency !== data.currency ||
          amount !== data.amount ||
          address?.id !== data.address?.id;
        return value;
      },

      hasNoElements: ({ elements }: BraintreeContext, _event: AnyEventObject) =>
        !elements,

      hasNoOutstandingBalance: (
        _context: BraintreeContext,
        _event: AnyEventObject
      ) => {
        // TODO: check if there is an outstanding balance
        return true;
      },

      hasInstance: (
        { braintree }: BraintreeContext,
        _event: AnyEventObject
      ) => {
        return !!braintree;
      },

      isAdding: ({ ctx }: BraintreeContext, _event: AnyEventObject) => {
        return ctx !== undefined && ctx == GatewayCtx.ADD;
      },
      isPaying: ({ ctx }: BraintreeContext, _event: AnyEventObject) => {
        return ctx !== undefined && ctx == GatewayCtx.PAY;
      }
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services
  }
);
