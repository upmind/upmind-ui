// --- external
import { createMachine, assign } from "xstate";

// --- internal
import services from "./services";
import { useFeedback } from "../feedback";
const { addError, addSuccess } = useFeedback();

// --- utils

import { useTime, useValidationParser } from "../../utils";

// --- types
import type { PaymentContext, PaymentEvent } from "./types";

// --------------------------------------------------------

export default createMachine(
  {
    tsTypes: {} as import("./payment.machine.typegen").Typegen0,
    id: "paymentManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      error: null
    } as PaymentContext,
    states: {
      loading: {},
      processing: {
        entry: ["clearError"],
        invoke: {
          src: "src of the sub machine type, eg: Stripe",
          onDone: {
            target: "processed",
            actions: ["setFeedbackSuccess"]
          },
          onError: {
            target: "error",
            actions: ["setError", "setFeedbackError"]
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
        data: (_context, _event) => ({})
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
      // ---
      setFeedbackSuccess: (_context, _event) => {
        addSuccess("Successfully made payment");
      },

      setFeedbackError: ({ error }, _event) => {
        addError({
          title:
            error?.title || "We experienced an error processing your payment",
          copy: error?.message,
          data: error?.data
        });
      },

      setError: assign({
        error: (_context, { data }) => {
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
      hasNoOutstandingBalance: (_context, _event) => {
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
