// --- external
import { createMachine, assign, sendParent, spawn } from "xstate";

// --- internal
import services from "./services";
import { useFeedback } from "../../../feedback";
const { addError, addSuccess } = useFeedback();

// --- utils
import { useTime, useValidationParser } from "../../../../utils";
import { useSchema, useUischema, useModelParser } from "./utils";

// --- types
import type { StripeContext, StripeEvent } from "./types.d";
import { GatewayContext } from "../../types.d";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./stripe.machine.typegen").Typegen0,
    id: "stripePaymentManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      gateway: undefined,
      schema: undefined,
      uischema: undefined,
      model: undefined,
      // ---
      error: null
    } as StripeContext,
    states: {
      loading: {
        initial: "stripe",
        states: {
          stripe: {
            invoke: {
              src: "load",
              onDone: [
                {
                  target: "addElement",
                  actions: ["setStripeInstance"],
                  cond: "isAdding"
                },
                {
                  target: "paymentElement",
                  actions: ["setStripeInstance"]
                  // cond: "isPaying"
                }
              ],
              onError: {
                target: "#error",
                actions: ["setError", "setFeedbackError"]
              }
            }
          },
          paymentElement: {
            invoke: {
              src: "createPaymentElement",
              onDone: {
                target: "#checking",
                actions: ["setElements"]
              },
              onError: {
                target: "#error",
                actions: ["setError", "setFeedbackError"]
              }
            }
          },

          addElement: {
            invoke: {
              src: "createAddElement",
              onDone: {
                target: "#checking",
                actions: ["setElements", "setClientDetails"]
              },
              onError: {
                target: "#error",
                actions: ["setError", "setFeedbackError"]
              }
            }
          }
        }
      },

      // ---
      checking: {
        entry: ["clearError"],
        id: "checking",
        initial: "parsing",
        states: {
          parsing: {
            invoke: {
              src: "parse",
              onDone: {
                target: "validating",
                actions: ["setContext", "setSchemas"]
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
              src: "update",
              onDone: {
                target: "#processed",
                actions: ["setPaymentDetails", "providePaymentDetails"]
              }
            }
          },
          adding: {
            invoke: {
              src: "confirmSetup",
              onDone: {
                target: "#processed",
                actions: ["set"]
              }
            }
          }
        }
      },

      processed: {
        id: "processed",
        after: {
          wait: {
            target: "complete",
            cond: "hasNoOutstandingBalance"
          }
        }
      },

      complete: {
        id: "complete",
        type: "final",
        data: ({ paymentDetails }: StripeContext, _event: StripeEvent) =>
          paymentDetails
      },

      error: {
        id: "error",
        on: {
          RETRY: {
            target: "processing"
          }
        }
      }
    },
    on: {
      CLEAR: {
        target: "#checking",
        actions: ["clearModel"]
      },
      SET: {
        target: "#checking",
        actions: ["setModel"]
      },

      VALIDATE: {
        target: "#checking.validating",
        actions: ["setElementStatus"]
      },

      UNAUTHENTICATED: {
        target: "loading",
        actions: ["clearError", "clearModel", "clearSchemas"]
      }
    }
  },
  {
    actions: {
      setStripeInstance: assign({
        stripe: (_context: StripeContext, { data }: StripeEvent) => data
      }),

      setElements: assign({
        elements: (_context: StripeContext, { data }: StripeEvent) =>
          data?.elements,
        element: (_context: StripeContext, { data }: StripeEvent) =>
          data?.element,
        renderer: (_context: StripeContext, { data }: StripeEvent) => {
          function renderer(container: HTMLElement) {
            data?.element?.mount(container);
          }
          return renderer;
        },
        validationObserver: (
          { element }: StripeContext,
          { data }: StripeEvent
        ) => {
          const stripeChangeEvent = (callback, receive) => {
            data.element.on("change", event =>
              callback({ type: "VALIDATE", data: event })
            );

            return () => {};
          };

          return spawn(stripeChangeEvent);
        }
      }),

      setElementStatus: assign({
        elementStatus: (_context: StripeContext, { data }: StripeEvent) => data
      }),

      setClientDetails: assign({
        clientPaymentDetailsId: (
          _context: StripeContext,
          { data }: StripeEvent
        ) => data?.clientPaymentDetailsId,
        clientSecret: (_context: StripeContext, { data }: StripeEvent) =>
          data?.clientSecret
      }),

      setContext: assign(
        (_context: CurrencyContext, { data }: CurrencyEvent) => data
      ),

      // ---
      setSchemas: assign({
        schema: context => useSchema(context),
        uischema: context => useUischema(context),
        model: context => useModelParser(context, context.model)
      }),

      clearSchemas: assign({
        schema: undefined,
        uischema: undefined
      }),

      setModel: assign({
        model: (context, { data }) => useModelParser(context, data)
      }),

      clearModel: assign({
        model: undefined
      }),

      // ---
      setPaymentDetails: assign({
        paymentDetails: (_context, { data }) => data
      }),

      providePaymentDetails: sendParent(({ paymentDetails }) => ({
        type: "PAYMENT_DETAILS",
        data: paymentDetails
      })),

      // ---
      setFeedbackError: ({ error }: StripeContext, _event: StripeEvent) => {
        addError({
          title:
            error?.title || "We experienced an error processing your payment",
          copy: error?.message,
          data: error?.data
        });
      },

      setError: assign({
        error: (_context: StripeContext, { data }: StripeEvent) => {
          let error = data?.error;
          if (error?.code == 422) {
            // lets parse/override our error message and data
            // this is to generate valid json schema validation errors
            error = useValidationParser(error);
          }

          return error || data;
        }
      }),

      clearError: assign({ error: null })
    },

    guards: {
      hasNoOutstandingBalance: (
        _context: StripeContext,
        _event: StripeEvent
      ) => {
        // TODO: check if there is an outstanding balance
        return true;
      },

      isAdding: ({ ctx }: StripeContext, _event: StripeEvent) => {
        return ctx === GatewayContext.ADD;
      },
      isPaying: ({ ctx }: StripeContext, _event: StripeEvent) => {
        return ctx === GatewayContext.PAY;
      }
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services
  }
);
