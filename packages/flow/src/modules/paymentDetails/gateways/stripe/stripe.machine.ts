// --- external
import { createMachine, assign, sendParent } from "xstate";

// --- internal
import services from "./services";
import { useFeedback } from "../../../feedback";
const { addError, addSuccess } = useFeedback();

// --- utils
import { useTime, useValidationParser } from "../../../../utils";

// --- types
import type { StripeContext, StripeEvent } from "./types.d";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./stripe.machine.typegen").Typegen0,
    id: "stripePaymentManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
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
                  cond: "isAddingPaymentMethod"
                },
                {
                  target: "paymentElement",
                  actions: ["setStripeInstance"]
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
                target: "#idle",
                actions: ["setElements", "provideElements"]
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
                target: "#idle",
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

      idle: {
        id: "idle",
        on: {
          CHECKOUT: "processing.payment",
          PAY: "processing.payment",
          ADD: "processing.payment_method"
        }
      },

      processing: {
        entry: ["clearError"],
        states: {
          payment: {
            invoke: {
              src: "makePayment",
              onDone: {
                target: "#processed",
                actions: ["setPaymentData", "setFeedbackSuccess"]
              }
            }
          },
          payment_method: {
            invoke: {
              src: "confirmSetup",
              onDone: {
                target: "#processed",
                actions: ["set", "setFeedbackSuccess"]
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
        data: ({ payment }: StripeContext, _event: StripeEvent) => payment
      },

      error: {
        id: "error",
        on: {
          RETRY: {
            target: "processing"
          }
        }
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
          data?.element
      }),

      setClientDetails: assign({
        clientPaymentDetailsId: (
          _context: StripeContext,
          { data }: StripeEvent
        ) => data?.clientPaymentDetailsId,
        clientSecret: (_context: StripeContext, { data }: StripeEvent) =>
          data?.clientSecret
      }),

      setPaymentData: assign({
        payment: (_context: StripeContext, { data }: StripeEvent) => data
      }),
      // ---

      provideElements: sendParent(({ element }: StripeContext) => ({
        type: "MOUNT",
        data: element
      })),

      // ---
      setFeedbackSuccess: (_context: StripeContext, _event: StripeEvent) => {
        addSuccess("Successfully made payment");
      },

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

      isAddingPaymentMethod: (_context: StripeContext, _event: StripeEvent) => {
        return false; // TODO: check if we are adding a payment method
      }
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services
  }
);
