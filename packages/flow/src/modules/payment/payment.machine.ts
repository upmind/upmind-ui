// --- external
import { createMachine, assign, sendParent } from "xstate";

// --- internal
import services from "./services";
import { useFeedback } from "../feedback";
const { addError, addSuccess } = useFeedback();

// --- utils
import { useTime, useValidationParser } from "../../utils";

// --- types
import type { PaymentContext, PaymentEvent } from "./types.d";
import { isEmpty } from "lodash-es";

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
      loading: {
        invoke: {
          src: "load",
          onDone: {
            target: "checking",
            actions: ["setContext"]
          },
          onError: {
            target: "#error",
            actions: ["setError", "setFeedbackError"]
          }
        }
      },

      // ---
      checking: {
        entry: ["clearError"],
        id: "checking",
        invoke: {
          src: "validate",
          onDone: { target: "#valid" },
          onError: {
            target: "#invalid",
            actions: ["setError"]
          }
        }
      },

      invalid: {
        id: "invalid",
        on: {
          "xstate.update": {
            target: "checking"
          }
        }
      },

      valid: {
        id: "valid",
        always: [
          {
            target: "processing",
            cond: "hasPaymentDetails"
          }
        ],
        on: {
          PAY: { target: "processing" },
          "xstate.update": {
            target: "checking"
          }
        }
      },

      processing: {
        invoke: {
          src: "update",
          onDone: {
            target: "processed",
            actions: ["setPayment", "providePayment", "setFeedbackSuccess"]
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
          wait: [
            {
              target: "approving",
              cond: "needsApproval"
            },
            {
              target: "complete",
              cond: "hasNoOutstandingBalance"
            },
            { target: "invalid" }
          ]
        }
      },

      approving: {
        invoke: {
          src: "redirect",
          onDone: {
            target: "complete"
          },
          onError: {
            target: "error",
            actions: ["setError", "setFeedbackError"]
          }
        }
      },

      complete: {
        id: "complete",
        type: "final",
        data: ({ payment }: PaymentContext, _event: PaymentEvent) => payment
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
      setContext: assign(
        (_context: PaymentDetailsContext, { data }: PaymentDetailsEvent) => data
      ),

      setPayment: assign({
        payment: (_context, { data }) => data
      }),

      providePayment: sendParent(({ payment }) => ({
        type: "PAYMENT",
        data: payment
      })),

      // ---
      setFeedbackSuccess: (_context: PaymentContext, _event: PaymentEvent) => {
        addSuccess("Successfully made payment");
      },

      setFeedbackError: ({ error }: PaymentContext, _event: PaymentEvent) => {
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
      hasPaymentDetails: (
        { paymentDetails }: PaymentContext,
        _event: PaymentEvent
      ) => !isEmpty(paymentDetails),

      needsApproval: ({ payment }: PaymentContext, _event: PaymentEvent) =>
        !!payment.approval_url,

      hasNoOutstandingBalance: (
        _context: PaymentContext,
        _event: PaymentEvent
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
