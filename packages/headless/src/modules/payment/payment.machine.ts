// --- external
import type { AnyEventObject } from "xstate";
import { createMachine, assign, sendParent, actions } from "xstate";
const { escalate } = actions;

// --- internal
import services from "./services";
import { useFeedback } from "../feedback";

// --- utils
import { useApprovalParser } from "./utils";
import { mapToHeadlessError, useTime, useValidationParser } from "../../utils";
import { isEmpty } from "lodash-es";

// --- types
import type { PaymentContext } from "./types";
import { responseCodes } from "../../utils";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    //tsTypes: {} as import("./payment.machine.typegen").Typegen0,
    id: "paymentManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {} as PaymentContext,
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
            actions: ["setError"]
          }
        }
      },

      // ---
      checking: {
        entry: ["clearError"],
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
            actions: ["setPayment", "providePayment"]
          },
          onError: {
            target: "error",
            actions: ["setError"]
          }
        }
      },

      processed: {
        id: "processed",
        after: {
          wait: [
            {
              target: "approving",
              cond: "needsApproval",
              actions: ["setApproval"]
            },
            {
              target: "complete"
            }
          ]
        }
      },

      approving: {
        initial: "redirecting",
        states: {
          redirecting: {
            invoke: {
              src: "redirect",
              onDone: {
                target: "offsite"
              },
              onError: {
                target: "#error",
                actions: ["setError"]
              }
            }
          },
          offsite: {
            on: {
              APPROVED: {
                target: "#complete"
              }
            }
          }
        }
      },

      complete: {
        id: "complete",
        type: "final",
        data: ({ payment }: PaymentContext, _event: AnyEventObject) => payment
      },

      error: {
        entry: escalate(({ error }, _event) => error),
        id: "error"
        // type: "final",
      }
    }
  },
  {
    actions: {
      setContext: assign(
        // (_context: PaymentDetailsContext, { data }: PaymentDetailsEvent) => data
        (_context, { data }: AnyEventObject) => data
      ),

      setPayment: assign({
        payment: (_context, { data }: AnyEventObject) => data
      }),

      setApproval: assign({
        approval: ({ payment }: PaymentContext) => useApprovalParser(payment)
      }),

      providePayment: sendParent(({ payment }) => ({
        type: "PAYMENT",
        data: payment
      })),

      setError: assign({
        error: (_context, { data }: AnyEventObject) => {
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
      hasPaymentDetails: (
        { paymentDetail }: PaymentContext,
        _event: AnyEventObject
      ) => !isEmpty(paymentDetail),

      needsApproval: ({ payment }: PaymentContext, _event: AnyEventObject) =>
        !isEmpty(payment?.approval_url)
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services
  }
);
