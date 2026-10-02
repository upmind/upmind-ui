/** @internal */
import { createMachine, assign, spawn } from "xstate";
import { InvoiceStatusGroups } from "@upmind-automation/types";
import { paymentMachine } from "../payment";
import { authSubscription } from "../session-store";
import services from "./invoice.services";
import {
  canChangePaymentCurrency,
  spawnInvoicePaymentDetail
} from "./invoice.utils";
import { mapInvoice } from "./invoices.mappers";
import {
  mapToHeadlessError,
  stopService,
  useTime,
  isStoppedService
} from "../../utils";
import { get, includes, isEmpty } from "lodash-es";
import type {
  InvoiceCurrencyConversion,
  InvoiceLookups,
  InvoicePayContext,
  LastPaymentModel
} from "./invoices.types";
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
              },
              SET_CURRENCY: {
                target: "#converting",
                cond: "canChangeCurrency"
              }
            }
          },

          // Convert the unpaid amount to the chosen pay currency
          converting: {
            id: "converting",
            invoke: {
              src: "convertCurrency",
              onDone: {
                target: "#collecting",
                actions: ["setPaymentCurrency", "clearLastPaymentModel"]
              },
              onError: {
                target: "#collecting",
                actions: ["setConversionError"]
              }
            }
          },

          // Invoke paymentMachine to process the payment (POST /payments)
          paying: {
            id: "paying",
            invoke: {
              id: "payment",
              src: paymentMachine,
              data: ({
                invoice,
                rawInvoice,
                paymentDetail
              }: InvoicePayContext) => {
                return {
                  orderId: invoice?.id,
                  paymentDetail,
                  currencyCode:
                    rawInvoice?.payment_currency?.code ??
                    rawInvoice?.currency?.code,
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
        (_context: InvoicePayContext, { data }: AnyEventObject) => {
          const { config, ...rawInvoice } = data as InvoiceLookups;
          return {
            rawInvoice: rawInvoice as IInvoice,
            invoice: mapInvoice(rawInvoice as IInvoice),
            config
          };
        }
      ),

      setPaymentCurrency: assign(
        ({ rawInvoice }: InvoicePayContext, { data }: AnyEventObject) => {
          const { currency, unpaidAmount, unpaidAmountFormatted } =
            data as InvoiceCurrencyConversion;
          const copy = {
            ...rawInvoice,
            payment_currency: currency,
            payment_currency_id: currency.id,
            unpaid_amount_converted: unpaidAmount,
            unpaid_amount_formatted: unpaidAmountFormatted
          } as IInvoice;
          return {
            rawInvoice: copy,
            invoice: mapInvoice(copy),
            error: undefined,
            conversionError: undefined
          };
        }
      ),

      setConversionError: assign({
        conversionError: (
          _context: InvoicePayContext,
          { data }: AnyEventObject
        ) => mapToHeadlessError(data)
      }),

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
      canChangeCurrency: ({ config, invoice }: InvoicePayContext) =>
        canChangePaymentCurrency(config, invoice),

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
