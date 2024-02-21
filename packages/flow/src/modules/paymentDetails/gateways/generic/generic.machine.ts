// --- external
import { createMachine, assign, sendParent } from "xstate";

// --- internal
import services from "./services";
import { useFeedback } from "../../../feedback";
const { addError, addSuccess } = useFeedback();

// --- utils
import { useTime, useValidationParser } from "../../../../utils";

// --- types
import type { GenericContext, GenericEvent } from "./types";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./generic.machine.typegen").Typegen0,
    id: "stripePaymentManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      model: {},
      error: null
    } as GenericContext,
    states: {
      loading: {
        invoke: {
          src: "load",
          onDone: { target: "#idle" },
          onError: {
            target: "#error",
            actions: ["setError", "setFeedbackError"]
          }
        }
      },

      idle: {
        id: "idle",
        on: {
          CHECKOUT: "processing"
        }
      },

      processing: {
        entry: ["clearError"],

        invoke: {
          src: "makePayment",
          onDone: {
            target: "#processed",
            actions: [
              "setPaymentDetails",
              "providePaymentDetails",
              "setFeedbackSuccess"
            ]
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
        data: ({ paymentDetails }: GenericContext, _event: GenericEvent) =>
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
    }
  },
  {
    actions: {
      setPaymentDetails: assign({
        paymentDetails: (_context: GenericContext, { data }: GenericEvent) =>
          data
      }),

      providePaymentDetails: sendParent(
        ({ paymentDetails }: StripeContext) => ({
          type: "PAYMENT",
          data: paymentDetails
        })
      ),

      // ---
      setFeedbackSuccess: (_context: GenericContext, _event: GenericEvent) => {
        addSuccess("Successfully made payment");
      },

      setFeedbackError: ({ error }: GenericContext, _event: GenericEvent) => {
        addError({
          title:
            error?.title || "We experienced an error processing your payment",
          copy: error?.message,
          data: error?.data
        });
      },

      setError: assign({
        error: (_context: GenericContext, { data }: GenericEvent) => {
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
        _context: GenericContext,
        _event: GenericEvent
      ) => {
        // TODO: check if there is an outstanding balance
        return true;
      }
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services
  }
);
