// -----------------------------------------------------------------------------
/**
 * @module orders/__tests__/setup.integration
 * @description Replays this module's co-located fixtures through MSW (see
 * `@upmind-automation/test-fixtures/replay-server`), failing loudly on any
 * unmatched request. Imported by `orders.int.test.ts` so its replay lifecycle
 * registers for that file. Real network only in record/live mode.
 *
 * Also installs background stubs for endpoints this module's dependencies call
 * (brand/settings, routing) — required for integration tests where those
 * modules are NOT the subject under test.
 */

import { join } from "node:path";
import { http, HttpResponse } from "msw";
import { vi } from "vitest";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { startReplayServer } from "@upmind-automation/test-fixtures/replay-server";

// -----------------------------------------------------------------------------

const recordingsDir = join(import.meta.dirname, "fixtures");

function fixtureStubValues(): { invoiceAmount: number; walletAmount: number } {
  const invoice = getFixtureBody<{ data?: { unpaid_amount?: number } }>(
    "get-invoices-id-case-unpaid",
    { recordingsDir }
  );
  const wallet = getFixtureBody<{
    data?: { total?: Record<string, { amount?: number }> };
  }>("get-wallet-balance", { recordingsDir });

  const invoiceAmount = invoice?.data?.unpaid_amount ?? 72;
  const walletAmount = wallet?.data?.total?.GBP?.amount ?? 8;
  return { invoiceAmount, walletAmount };
}

const { invoiceAmount, walletAmount } = fixtureStubValues();

export const server = startReplayServer({ recordingsDir });

server.use(
  http.get("*/org/modules", () =>
    HttpResponse.json({ status: "ok", data: [] })
  ),
  http.get("*/config/organisation/values", () =>
    HttpResponse.json({ status: "ok", data: {} })
  ),
  http.get("*/brand/settings", () =>
    HttpResponse.json({ status: "ok", data: {} })
  ),
  http.get("*/billing_cycles", () =>
    HttpResponse.json({ status: "ok", data: [] })
  )
);

vi.mock("../../routing/useQueryParams", () => ({
  useQueryParams: () => ({
    getParam: vi.fn(() => undefined),
    setParam: vi.fn(),
    consumeParam: vi.fn(() => undefined)
  })
}));

export type PaymentStubOutcome = "done" | "error" | "challenge";
let paymentStubOutcome: PaymentStubOutcome = "done";

export function setPaymentStubOutcome(outcome: PaymentStubOutcome): void {
  paymentStubOutcome = outcome;
}

export type ChallengeStubOutcome = "complete" | "cancel";
let challengeStubOutcome: ChallengeStubOutcome = "complete";

export function setChallengeStubOutcome(outcome: ChallengeStubOutcome): void {
  challengeStubOutcome = outcome;
}

vi.mock("../../payment", async () => {
  const xstate = await import("xstate");
  const { createMachine, actions, sendParent, assign } = xstate;
  const escalate = actions.escalate;
  return {
    paymentMachine: createMachine(
      {
        id: "paymentStub",
        initial: "idle",
        context: {
          payment: undefined as { approval_url?: string } | undefined
        },
        states: {
          idle: {
            after: {
              10: [
                { target: "done", cond: "shouldSucceed" },
                { target: "processed", cond: "shouldChallenge" },
                { target: "error" }
              ]
            }
          },
          processed: {
            entry: "setApprovalUrlForChallenge",
            always: { target: "challenging" }
          },
          challenging: {
            initial: "determining",
            states: {
              determining: {
                always: { target: "render" }
              },
              render: {
                initial: "waiting",
                entry: "notifyRender",
                states: {
                  waiting: {
                    on: {
                      CHALLENGE_RESPONSE: { target: "#paymentStub.complete" },
                      CHALLENGE_CANCELLED: { target: "#paymentStub.cancelled" },
                      SUBMIT_CHALLENGE: { target: "#paymentStub.complete" }
                    },
                    after: {
                      100: [
                        {
                          target: "#paymentStub.complete",
                          cond: "shouldAutoComplete"
                        },
                        { target: "waiting" }
                      ]
                    }
                  }
                }
              }
            }
          },
          complete: {
            type: "final" as const,
            data: { success: true }
          },
          cancelled: {
            entry: escalate({ message: "Challenge cancelled by user" })
          },
          done: {
            type: "final" as const,
            data: { success: true }
          },
          error: {
            entry: escalate({ message: "Payment failed" })
          }
        }
      },
      {
        guards: {
          shouldSucceed: () => paymentStubOutcome === "done",
          shouldChallenge: () => paymentStubOutcome === "challenge",
          shouldAutoComplete: () => challengeStubOutcome === "complete"
        },
        actions: {
          setApprovalUrlForChallenge: assign({
            payment: () => ({ approval_url: "https://stub-3ds-challenge.test" })
          }),
          notifyRender: sendParent({
            type: "RENDER",
            renderer: "stub-renderer",
            url: "https://stub-3ds-challenge.test"
          })
        }
      }
    )
  };
});

vi.mock("../../payment-details", async importOriginal => {
  const original =
    await importOriginal<typeof import("../../payment-details")>();
  const { createMachine, sendParent } = await import("xstate");
  return {
    ...original,
    paymentDetailsMachine: createMachine(
      {
        id: "paymentDetailsStub",
        initial: "valid",
        context: {
          isInvoked: true,
          model: {
            amount: invoiceAmount,
            gateway_id: "stub-gateway-id",
            payment_details_id: "stub-payment-details-id",
            wallet_amount: walletAmount
          },
          paymentDetail: {
            amount: invoiceAmount,
            gateway_id: "stub-gateway-id",
            payment_details_id: "stub-payment-details-id",
            wallet_amount: walletAmount
          }
        },
        states: {
          valid: {
            on: {
              PAY: { target: "complete" }
            }
          },
          complete: {
            type: "final" as const,
            entry: "providePaymentDetails"
          }
        }
      },
      {
        actions: {
          providePaymentDetails: sendParent(
            (ctx: {
              paymentDetail?: {
                amount: number;
                gateway_id: string;
                payment_details_id: string;
                wallet_amount: number;
              };
            }) => ({
              type: "PAYMENT_DETAILS",
              data: {
                amount: ctx.paymentDetail?.amount ?? invoiceAmount,
                gateway_id: ctx.paymentDetail?.gateway_id ?? "stub-gateway-id",
                payment_details_id:
                  ctx.paymentDetail?.payment_details_id ??
                  "stub-payment-details-id",
                wallet_amount: ctx.paymentDetail?.wallet_amount ?? walletAmount
              }
            })
          )
        }
      }
    )
  };
});
