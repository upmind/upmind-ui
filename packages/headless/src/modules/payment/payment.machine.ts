// --- external
import type { AnyEventObject } from "xstate";
import { createMachine, assign, sendParent, actions, spawn } from "xstate";
const { escalate } = actions;

// --- internal
import services from "./services";
import { authSubscription } from "../session/helper";
import { useDataLayer } from "../system";

// --- utils
import { mapApproval, hasRenderer } from "./mappers";
import { mapToHeadlessError, useTime, useValidationParser } from "../../utils";
import { isEmpty } from "lodash-es";

// --- types
import { GatewayTypes, TransactionStatus } from "@upmind-automation/types";
import type { PaymentContext } from "./types";
import { responseCodes } from "../../utils";

// -----------------------------------------------------------------------------
export default createMachine(
  {
    //tsTypes: {} as import("./payment.machine.typegen").Typegen0,
    id: "PaymentManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as PaymentContext,
    states: {
      // Subscribe to auth changes and wait for a valid session
      subscribing: {
        entry: ["setAuthHelper"],
        on: {
          AUTHENTICATED: { target: "loading" }
        }
      },

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
        id: "invalid"
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
          PAY: { target: "processing" }
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
              target: "challenging",
              actions: ["setApproval"],
              cond: "needsChallenge"
            },
            {
              target: "instructions",
              cond: "needsInstructions"
            },
            {
              target: "complete"
            }
          ]
        }
      },

      /**
       * Challenge state for payment approval/3DS verification.
       * Supports two flows:
       * - Redirect: Offsite payment approval (PayPal, 3DS redirect, etc.)
       * - Render: Inline 3DS challenge that renders gateway-specific UI
       */
      challenging: {
        initial: "determining",
        states: {
          // Determine which flow to use based on whether a renderer exists
          determining: {
            always: [
              {
                target: "render",
                cond: "hasRenderer"
              },
              {
                target: "redirecting"
              }
            ]
          },
          // Redirect flow - offsite payment approval (original behavior)
          redirecting: {
            invoke: {
              src: "redirect",
              onDone: {
                target: "offsite",
                actions: ["pushOffsite"]
              },
              onError: {
                target: "#error",
                actions: ["setError"]
              }
            }
          },
          // Offsite state - waiting for external callback
          offsite: {
            on: {
              CHALLENGE_RESPONSE: {
                target: "#complete"
              },
              CHALLENGE_CANCELLED: {
                target: "#error"
              }
            }
          },
          // Render flow - gateway-specific UI rendering
          render: {
            initial: "waiting",
            states: {
              // Wait for container element before rendering
              waiting: {
                on: {
                  RENDER: {
                    target: "rendering"
                  }
                }
              },
              rendering: {
                invoke: {
                  src: "render",
                  onDone: {
                    target: "idle"
                  },
                  onError: {
                    target: "#error",
                    actions: ["setError"]
                  }
                }
              },
              idle: {}
            },
            on: {
              CHALLENGE_RESPONSE: {
                target: "#complete"
              },
              CHALLENGE_CANCELLED: {
                target: "#error",
                actions: ["setError"]
              }
            }
          }
        }
      },

      /**
       * Instructions state for displaying payment instructions.
       * Waits for user to dismiss before transitioning to complete.
       */
      instructions: {
        id: "instructions",
        on: {
          DISMISS_INSTRUCTIONS: {
            target: "#complete"
          }
        }
      },

      complete: {
        id: "complete",
        type: "final",
        data: ({ payment }: PaymentContext, _event: AnyEventObject) => payment
      },

      error: {
        entry: "escalateError",
        id: "error"
        // type: "final",
      }
    },

    on: {
      // Auth lost — return to subscribing
      UNAUTHENTICATED: {
        target: "subscribing",
        actions: ["clearError"]
      }
    }
  },
  {
    actions: {
      setAuthHelper: assign({
        authHelper: ({ authHelper }: PaymentContext, _event: AnyEventObject) =>
          authHelper ?? spawn(authSubscription)
      }),

      setContext: assign(
        // (_context: PaymentDetailsContext, { data }: PaymentDetailsEvent) => data
        (_context, { data }: AnyEventObject) => data
      ),

      setPayment: assign({
        payment: (_context, { data }: AnyEventObject) => data
      }),

      setApproval: assign({
        approval: ({ payment }: PaymentContext) => mapApproval(payment)
      }),

      providePayment: sendParent(({ payment }) => ({
        type: "PAYMENT",
        data: payment
      })),

      // When a user goes offsite to process their payment
      pushOffsite: ({ payment }: PaymentContext, _event: AnyEventObject) => {
        useDataLayer()
          .dataLayer({ event: "begin_offsite_payment", ...payment })
          .push();
      },

      setError: assign({
        error: (_context, { data }: AnyEventObject) => {
          let error = mapToHeadlessError(data);
          if (error?.status == responseCodes.Unprocessable_Entity) {
            error.data = useValidationParser(error);
          }
          return error;
        }
      }),

      clearError: assign({ error: undefined }),

      escalateError: escalate(
        ({ error }: PaymentContext, _event: AnyEventObject) => error
      )
    },

    guards: {
      hasPaymentDetails: (
        { paymentDetail }: PaymentContext,
        _event: AnyEventObject
      ) => !isEmpty(paymentDetail),

      needsChallenge: ({ payment }: PaymentContext, _event: AnyEventObject) => {
        return !isEmpty(payment?.approval_url);
      },

      // Check if a renderer exists for this gateway
      hasRenderer: (context: PaymentContext, _event: AnyEventObject) => {
        const gatewayCode = (context as any).gateway?.gateway_provider_code;
        const value = hasRenderer(gatewayCode);
        return value;
      },

      needsInstructions: (
        { payment, paymentDetail, rawOrder }: PaymentContext,
        _event: AnyEventObject
      ) => {
        return (
          payment?.transaction_status === TransactionStatus.WAITING &&
          rawOrder?.gateway?.type === GatewayTypes.AWAITING_CLIENT
        );
      }
    },

    delays: {
      error: () => useTime().ERROR,
      wait: () => useTime().WAIT
    },

    services
  }
);
