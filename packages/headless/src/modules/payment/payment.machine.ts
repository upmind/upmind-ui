// --- external
import type { AnyEventObject } from "xstate";
import { createMachine, assign, sendParent, actions } from "xstate";
const { escalate } = actions;

// --- internal
import services from "./services";
import { useFeedback } from "../feedback";
const { addError, addSuccess } = useFeedback();

// --- utils
import { useApprovalParser } from "./utils";
import { useTime, useValidationParser } from "../../utils";
import { isEmpty } from "lodash-es";

// --- types
import type { PaymentContext } from "./types";
import { responseCodes } from "../../utils";

// --------------------------------------------------------

export default createMachine(
  {
    //tsTypes: {} as import("./payment.machine.typegen").Typegen0,
    id: "paymentManager",
    predictableActionArguments: true,
    initial: "loading",
    context: {
      error: null,
    } as PaymentContext,
    states: {
      loading: {
        invoke: {
          src: "load",
          onDone: {
            target: "checking",
            actions: ["setContext"],
          },
          onError: {
            target: "#error",
            actions: ["setError"],
          },
        },
      },

      // ---
      checking: {
        entry: ["clearError"],
        invoke: {
          src: "validate",
          onDone: { target: "#valid" },
          onError: {
            target: "#invalid",
            actions: ["setError"],
          },
        },
      },

      invalid: {
        id: "invalid",
        on: {
          "xstate.update": {
            target: "checking",
          },
        },
      },

      valid: {
        id: "valid",
        always: [
          {
            target: "processing",
            cond: "hasPaymentDetails",
          },
        ],
        on: {
          PAY: { target: "processing" },
          "xstate.update": {
            target: "checking",
          },
        },
      },

      processing: {
        invoke: {
          src: "update",
          onDone: {
            target: "processed",
            actions: ["setPayment", "providePayment"],
          },
          onError: {
            target: "error",
            actions: ["setError"],
          },
        },
      },

      processed: {
        id: "processed",
        after: {
          wait: [
            {
              target: "approving",
              cond: "needsApproval",
              actions: ["setApproval"],
            },
            {
              target: "complete",
              actions: "setFeedbackSuccess",
            },
          ],
        },
      },

      approving: {
        initial: "redirecting",
        states: {
          redirecting: {
            invoke: {
              src: "redirect",
              onDone: {
                target: "offsite",
              },
              onError: {
                target: "#error",
                actions: ["setError"],
              },
            },
          },
          offsite: {
            on: {
              APPROVED: {
                target: "#complete",
              },
            },
          },
        },
      },

      complete: {
        id: "complete",
        type: "final",
        data: ({ payment }: PaymentContext, _event: AnyEventObject) => payment,
      },

      error: {
        entry: escalate(({ error }, _event) => error),
        id: "error",
        // type: "final",
      },
    },
  },
  {
    actions: {
      setContext: assign(
        // (_context: PaymentDetailsContext, { data }: PaymentDetailsEvent) => data
        (_context, { data }: AnyEventObject) => data
      ),

      setPayment: assign({
        payment: (_context, { data }: AnyEventObject) => data,
      }),

      setApproval: assign({
        payment: context => useApprovalParser(context),
      }),

      providePayment: sendParent(({ payment }) => ({
        type: "PAYMENT",
        data: payment,
      })),

      // ---
      setFeedbackSuccess: (
        _context: PaymentContext,
        _event: AnyEventObject
      ) => {
        addSuccess("Successfully made payment");
      },

      // setFeedbackError: ({ error }: PaymentContext, _event: AnyEventObject) => {
      //   if (
      //     !error?.message ||
      //     error?.code == responseCodes.Unprocessable_Entity
      //   )
      //     return;
      //   addError({
      //     title: error?.title ?? error?.message,
      //     copy: error?.title ? error?.message : null,
      //     data: error?.data,
      //   });
      // },

      setError: assign({
        error: (_context, { data }: AnyEventObject) => {
          let error = data?.error?.data ?? data?.error ?? data;
          if (error?.code == responseCodes.Unprocessable_Entity) {
            // lets parse/override our error message and data
            // this is to generate valid json schema validation errors
            error = useValidationParser(error);
          }

          return error;
        },
      }),

      clearError: assign({ error: null }),
    },

    guards: {
      hasPaymentDetails: (
        { paymentDetails }: PaymentContext,
        _event: AnyEventObject
      ) => !isEmpty(paymentDetails),

      needsApproval: ({ payment }: PaymentContext, _event: AnyEventObject) =>
        !!payment.approval_url,

      hasNoOutstandingBalance: (
        _context: PaymentContext,
        _event: AnyEventObject
      ) => {
        // TODO: check if there is an outstanding balance
        return true;
      },
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT,
    },

    services,
  }
);
