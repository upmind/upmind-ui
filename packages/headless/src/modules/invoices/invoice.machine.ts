/** @internal */
import { createMachine, assign, spawn } from "xstate";
import { InvoiceStatusGroups } from "@upmind-automation/types";
import { paymentMachine } from "../payment";
import { authSubscription } from "../session-store";
import services from "./invoice.services";
import { spawnInvoicePaymentDetail } from "./invoice.utils";
import { mapInvoice } from "./invoices.mappers";
import {
  mapToHeadlessError,
  stopService,
  useTime,
  isStoppedService
} from "../../utils";
import { get, includes, isEmpty } from "lodash-es";
import type { InvoicePayContext, LastPaymentModel } from "./invoices.types";
import type { PaymentArgs } from "../payment";
import type { IInvoice } from "@upmind-automation/types";
import type { AnyEventObject } from "xstate";

// -----------------------------------------------------------------------------
/**
 * @module invoices/invoice.machine
 * @description XState orchestrator machine for single-invoice payment flows.
 * Modeled after the basket machine pattern — spawns paymentDetailMachine as a
 * child actor, invokes paymentMachine in the paying state, and supports retry
 * and partial payment loops.
 */

export default createMachine(
  {
    id: "invoiceManager",
    predictableActionArguments: true,
    initial: "subscribing",
    context: {} as InvoicePayContext,
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
              data: ({ invoice, paymentDetail }: InvoicePayContext) => {
                return {
                  orderId: invoice?.id,
                  paymentDetail,
                  parentId: "invoiceManager"
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
        authHelper: (
          { authHelper }: InvoicePayContext,
          _event: AnyEventObject
        ) => authHelper ?? spawn(authSubscription)
      }),

      setInvoice: assign(
        (_context: InvoicePayContext, { data }: AnyEventObject) => ({
          rawInvoice: data as IInvoice,
          invoice: mapInvoice(data as IInvoice)
        })
      ),

      setPaymentDetail: assign({
        paymentDetail: (
          _context: InvoicePayContext,
          { data }: AnyEventObject
        ) => data
      }),

      setError: assign({
        error: (_context: InvoicePayContext, { data }: AnyEventObject) =>
          mapToHeadlessError(data)
      }),

      clearError: assign({ error: undefined }),

      clearLastPaymentModel: assign({ lastPaymentModel: undefined }),

      // Persist user selections before paying so we can pre-fill on retry/partial
      persistSelections: assign({
        lastPaymentModel: (
          _context: InvoicePayContext,
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
        }: InvoicePayContext) => {
          if (!rawInvoice) return undefined;
          return spawnInvoicePaymentDetail(rawInvoice, lastPaymentModel);
        }
      }),

      clearPaymentDetailActor: assign({
        paymentDetailActor: ({ paymentDetailActor }: InvoicePayContext) => {
          if (paymentDetailActor && !isStoppedService(paymentDetailActor)) {
            stopService(paymentDetailActor);
          }
          return undefined;
        }
      }),

      forwardPay: ({ paymentDetailActor }: InvoicePayContext) => {
        paymentDetailActor?.send({ type: "PAY" });
      }
    },

    guards: {
      isFreeOrPaid: (_context: InvoicePayContext, { data }: AnyEventObject) => {
        const raw = data as IInvoice;
        return includes(InvoiceStatusGroups.PAID, raw.status.code);
      },

      isFullyPaid: (_context: InvoicePayContext, { data }: AnyEventObject) => {
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
