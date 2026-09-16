// -----------------------------------------------------------------------------
/**
 * @fileoverview payment machine — the `processed` three-way fork (unit)
 *
 * ## Job To Be Done
 * A charge that is answered lands the machine in `processed`, a delayed
 * (`after: { wait }`) decision that routes the attempt down exactly one of three
 * arms. The routing is pure branch logic, and the module's docs
 * (`docs/architecture.md` — "The three-way fork") fix it as three guards
 * evaluated IN ORDER:
 *
 *   needsChallenge     the attempt carries an `approval_url`                → challenging
 *   needsInstructions  transaction_status === WAITING AND
 *                      gateway.type === AWAITING_CLIENT                     → instructions
 *   —                  neither                                             → complete
 *
 * Each test drives the machine's real success flow — a live session, a loaded
 * order and gateway, then a charge that answers with one attempt shape — so a
 * genuine transition arms the delayed fork, then fires it under fake timers and
 * asserts which state it lands in. The last test pins the ORDER: an attempt that
 * satisfies both of the first two guards must take `challenging`, never
 * `instructions` — the silent mis-route `docs/gotchas.md` warns a reorder causes.
 *
 * ## Data provenance, stated not implied
 * The challenge arm's charge answers with a REAL recorded provider response — the
 * PayPal sandbox `approval_url` captured by `pnpm fixtures:generate payment` — so
 * `needsChallenge` is proven against a body a provider actually returned. The
 * instructions and complete arms have no recorded body: a cleared charge is a
 * real charge and its capture is owed on FE-3130 (see `payment.fixtures.ts`).
 * Their attempts are type-permitted `IPaymentAttempt` / `IGateway` shapes built
 * from the published types and the fork spec above, NOT presented as recorded —
 * no fixture file is authored to stand one in (the discipline of
 * `payment.mappers.test.ts`).
 *
 * ## What Breaks If These Fail
 * A payment routes to the wrong arm: a bank confirmation that needs the client's
 * approval settles silently instead, an offline payment the client must act on
 * outside the app is marked complete, or a cleared payment is parked on an
 * instructions screen it can never leave.
 */

import { join } from "node:path";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { interpret } from "xstate";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import {
  GatewayTypes,
  TransactionStatus,
  TransactionTypes
} from "@upmind-automation/types";
import "./mocks";
import paymentMachine from "../payment.machine";
import {
  emitAuth,
  loadMock,
  redirectMock,
  renderMock,
  resetPaymentMocks,
  updateMock,
  validateMock
} from "./mocks";
import type { PaymentContext } from "../payment.types";
import type {
  IGateway,
  IInvoice,
  IPaymentAttempt
} from "@upmind-automation/types";

// -----------------------------------------------------------------------------

const CHALLENGE_FIXTURE = "post-payments-case-taken-up-paypal-express";
const recordingsDir = join(import.meta.dirname, "fixtures");

/** The real provider attempt that carries an `approval_url`, off the recording. */
function recordedApprovalAttempt(): IPaymentAttempt {
  const attempt = getFixtureBody<{ data: IPaymentAttempt }>(CHALLENGE_FIXTURE, {
    recordingsDir
  }).data;

  if (!attempt?.approval_url) {
    throw new Error(
      `Fixture ${CHALLENGE_FIXTURE} carries no approval_url. ` +
        "Re-run `pnpm fixtures:generate payment` to capture it."
    );
  }
  return attempt;
}

/** An attempt with no approval, shaped by `IPaymentAttempt` — never a recording. */
function attempt(transaction_status: TransactionStatus): IPaymentAttempt {
  return {
    transaction_id: "txn-fork-0001",
    transaction_status,
    transaction_type: TransactionTypes.SALE_DIRECT
  };
}

function gatewayOfType(type: GatewayTypes): IGateway {
  return { id: "gateway-0001", type } as IGateway;
}

function order(): IInvoice {
  return { id: "order-mine-0001" } as IInvoice;
}

function baseContext(): PaymentContext {
  return {
    orderId: "order-mine-0001",
    paymentDetail: {
      gateway_id: "gateway-0001"
    } as PaymentContext["paymentDetail"]
  };
}

/** Flush the microtask queue so the mocked service promises resolve. */
async function flush(): Promise<void> {
  for (let i = 0; i < 6; i++) await Promise.resolve();
}

/**
 * Drive the machine to `processed` via its real success flow, then fire the
 * delayed fork. The charge answers with `charge`; the loaded gateway is `gateway`.
 */
async function driveToFork(
  charge: IPaymentAttempt,
  gateway: IGateway
): Promise<ReturnType<typeof interpret>> {
  loadMock.mockResolvedValue({ rawOrder: order(), gateway });
  validateMock.mockResolvedValue(order());
  updateMock.mockResolvedValue(charge);

  const service = interpret(paymentMachine.withContext(baseContext()), {
    devTools: false
  }).start();

  emitAuth({ type: "AUTHENTICATED" });

  for (let i = 0; i < 12; i++) {
    await flush();
    vi.runOnlyPendingTimers();
  }
  await flush();

  return service;
}

// -----------------------------------------------------------------------------

describe("payment processed fork — which arm the delayed decision picks", () => {
  beforeEach(() => {
    resetPaymentMocks();
    redirectMock.mockResolvedValue(undefined);
    renderMock.mockResolvedValue(undefined);
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("routes an attempt carrying an approval_url to challenging", async () => {
    const service = await driveToFork(
      recordedApprovalAttempt(),
      gatewayOfType(GatewayTypes.CARD)
    );

    expect(service.state.matches("challenging")).toBe(true);

    service.stop();
  });

  it("routes a WAITING attempt on an awaiting-client gateway to instructions", async () => {
    const service = await driveToFork(
      attempt(TransactionStatus.WAITING),
      gatewayOfType(GatewayTypes.AWAITING_CLIENT)
    );

    expect(service.state.matches("instructions")).toBe(true);
    expect(service.state.matches("challenging")).toBe(false);

    service.stop();
  });

  it("routes a cleared attempt with neither signal to complete", async () => {
    const service = await driveToFork(
      attempt(TransactionStatus.OK),
      gatewayOfType(GatewayTypes.CARD)
    );

    expect(service.state.matches("complete")).toBe(true);

    service.stop();
  });

  it("prefers challenging over instructions when an attempt answers both guards", async () => {
    const bothEligible = {
      ...recordedApprovalAttempt(),
      transaction_status: TransactionStatus.WAITING
    };

    const service = await driveToFork(
      bothEligible,
      gatewayOfType(GatewayTypes.AWAITING_CLIENT)
    );

    expect(service.state.matches("challenging")).toBe(true);
    expect(service.state.matches("instructions")).toBe(false);

    service.stop();
  });
});
