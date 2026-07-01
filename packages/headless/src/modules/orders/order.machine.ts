/** @internal */
import { createMachine, assign, spawn } from "xstate";
import { InvoiceStatusGroups } from "@upmind-automation/types";
import { mapInvoice } from "../invoices";
import { paymentMachine } from "../payment";
import { authSubscription } from "../session-store";
import services from "./order.services";
import { spawnOrderPaymentDetail } from "./order.utils";
import {
  mapToHeadlessError,
  stopService,
  useTime,
  isStoppedService
} from "../../utils";
import { get, includes, isEmpty } from "lodash-es";
import type { OrderContext, LastPaymentModel } from "./order.types";
import type { PaymentArgs } from "../payment";
import type { IInvoice } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------
/**
 * @module orders/order.machine
 * @description XState orchestrator machine for invoice payment flows.
 * Modeled after the basket machine pattern — spawns paymentDetailMachine as a
 * child actor, invokes paymentMachine in the paying state, and supports retry
 * and partial payment loops.
 */

export default createMachine(
  {
    id: "orderManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as OrderContext,
    states: {
      // Subscribe to auth changes and wait for a valid session
      subscribing: {
        entry: ["setAuthHelper"],
        on: {
          AUTHENTICATED: { target: "loading" }
        }
      },

      // Fetch the invoice by ID
      loading: {
        id: "loading",
        invoke: {
          src: "loadLookups",
          onDone: [
            {
              target: "#complete",
              actions: ["setInvoice"],
              cond: "isFreeOrPaid"
            },
            {
              target: "#collecting",
              actions: ["setInvoice"]
            }
          ],
          onError: {
            target: "#unavailable",
            actions: ["setError"]
          }
        }
      },

      // Invoice loaded — payment flow active
      available: {
        id: "available",
        initial: "collecting",
        states: {
          // PaymentDetail actor is active — user selects gateway/method.
          // Entry spawns a fresh paymentDetail actor each time we enter this state,
          // which handles retry, partial payment loops, and initial entry uniformly.
          collecting: {
            id: "collecting",
            entry: ["clearPaymentDetailActor", "spawnPaymentDetail"],
            on: {
              PAYMENT_DETAILS: {
                target: "#paying",
                actions: ["persistSelections", "setPaymentDetail"]
              },
              CANCEL: {
                actions: ["clearError"]
              },
              PAY: {
                actions: ["forwardPay"]
              }
            }
          },

          // Invoke paymentMachine to process the payment (POST /payments)
          paying: {
            id: "paying",
            invoke: {
              id: "payment",
              src: paymentMachine,
              data: ({ invoice, paymentDetail }: OrderContext) => {
                return {
                  orderId: invoice?.id,
                  paymentDetail
                } as PaymentArgs;
              },
              onDone: {
                target: "#refreshing",
                actions: ["clearError"]
              },
              onError: {
                target: "#collecting",
                actions: ["setError"]
              }
            }
          },

          // Re-fetch invoice to check updated balance after payment
          refreshing: {
            id: "refreshing",
            invoke: {
              src: "refresh",
              onDone: [
                {
                  target: "#complete",
                  actions: ["setInvoice"],
                  cond: "isFullyPaid"
                },
                {
                  target: "#collecting",
                  actions: ["setInvoice", "clearLastPaymentModel"]
                }
              ],
              onError: {
                target: "#complete",
                actions: ["setError"]
              }
            }
          }
        }
      },

      // Invoice load error — no invoice data
      unavailable: {
        id: "unavailable"
      },

      // Fully paid or free invoice
      complete: {
        id: "complete"
      }
    },

    on: {
      // Allow re-fetching (e.g. after offsite 3DS return)
      REFRESH: {
        target: "#loading",
        actions: ["clearError"]
      },
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
        authHelper: ({ authHelper }: OrderContext, _event: AnyEventObject) =>
          authHelper ?? spawn(authSubscription)
      }),

      setInvoice: assign(
        (_context: OrderContext, { data }: AnyEventObject) => ({
          rawInvoice: data as IInvoice,
          invoice: mapInvoice(data as IInvoice)
        })
      ),

      setPaymentDetail: assign({
        paymentDetail: (_context: OrderContext, { data }: AnyEventObject) =>
          data
      }),

      setError: assign({
        error: (_context: OrderContext, { data }: AnyEventObject) =>
          mapToHeadlessError(data)
      }),

      clearError: assign({ error: undefined }),

      clearLastPaymentModel: assign({ lastPaymentModel: undefined }),

      // Persist user selections before paying so we can pre-fill on retry/partial
      persistSelections: assign({
        lastPaymentModel: (
          _context: OrderContext,
          { data }: AnyEventObject
        ) => {
          if (isEmpty(data)) return undefined;
          return {
            gateway_id: get(data, "gateway_id"),
            wallet_amount: get(data, "wallet_amount"),
            amount: get(data, "amount")
          } as LastPaymentModel;
        }
      }),

      spawnPaymentDetail: assign({
        paymentDetailActor: ({
          rawInvoice,
          lastPaymentModel
        }: OrderContext) => {
          if (!rawInvoice) return undefined;
          return spawnOrderPaymentDetail(rawInvoice, lastPaymentModel);
        }
      }),

      clearPaymentDetailActor: assign({
        paymentDetailActor: ({ paymentDetailActor }: OrderContext) => {
          if (paymentDetailActor && !isStoppedService(paymentDetailActor)) {
            stopService(paymentDetailActor);
          }
          return undefined;
        }
      }),

      forwardPay: ({ paymentDetailActor }: OrderContext) => {
        paymentDetailActor?.send({ type: "PAY" });
      }
    },

    guards: {
      isFreeOrPaid: (_context: OrderContext, { data }: AnyEventObject) => {
        const raw = data as IInvoice;
        return includes(InvoiceStatusGroups.PAID, raw.status.code);
      },

      isFullyPaid: (_context: OrderContext, { data }: AnyEventObject) => {
        const raw = data as IInvoice;
        return includes(InvoiceStatusGroups.PAID, raw.status.code);
      }
    },

    delays: {
      wait: () => useTime().WAIT
    },

    services
  }
);
