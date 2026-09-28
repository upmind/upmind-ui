// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — the legacy status/condition rules (unit, AC-18)
 *
 * ## Job To Be Done
 * Pin the design 8.5 truth table's legacy-rule pure functions —
 * `isOverdue`, `isPaid`, `isCancelled`, `isPartiallyPaid`, `canPay`,
 * `canCancel` — against literal expected outputs. Every row this pass can
 * prove is driven by a REAL recorded order (`paid`, `cancelled`), pulled
 * from this module's own `pnpm fixtures:generate client-orders` capture, not
 * a hand-authored record. The design 8.5 table is explicit that the state is
 * a CAPTURE or a sanctioned CONSTRUCTION — never a hand-typed guess.
 *
 * ## Capture-limitation disclosure (NFR-2)
 * This pass's real capture window carried NO `invoice_unpaid`,
 * `invoice_overdue`, or `invoice_refunded` row, and no way to distinguish
 * `part-paid` / `cancelled-part-paid` from the list alone (design 8.8's
 * recording-rule table: those three STOP and escalate rather than construct).
 * So the `unpaid`, `part-paid`, `overdue`, `refunded` and
 * `cancelled-part-paid` rows of design 8.5's table are NOT covered by this
 * file — escalated, not fabricated. The `cancellation request` row IS
 * covered: design 8.5 marks it explicitly "construction, unit only" — the
 * one row the design itself sanctions as a hand-built literal, over the
 * `InvoiceStatus` enum's own published member, not a guess.
 *
 * ## What Breaks If These Fail
 * A client sees "Cancel" on an order that cannot be cancelled, or "Pay" on
 * one that is already settled — the exact class of bug the legacy vue-app
 * rules these functions port already fixed once.
 */

import {
  canCancel,
  canPay,
  isCancelled,
  isOverdue,
  isPaid,
  isPartiallyPaid
} from "..";
import { recordingsDir } from "./setup.integration";
import { InvoiceStatus } from "@upmind-automation/types";
import { getFixtureBody } from "@upmind-automation/test-fixtures";
import { describe, expect, it } from "vitest";

// -----------------------------------------------------------------------------

type OrderLike = {
  status: { code: InvoiceStatus };
  paid_amount: number;
  unpaid_amount_converted: number;
};

function orderFixture(partialKey: string): OrderLike {
  const body = getFixtureBody<{ data: OrderLike }>(partialKey, {
    recordingsDir
  });
  return body.data;
}

// -----------------------------------------------------------------------------

describe("client-orders legacy status rules — real captures (AC-18)", () => {
  const paid = orderFixture("id-case-order-paid");
  const cancelled = orderFixture("id-case-order-cancelled");

  it("a real PAID order: isPaid true, everything else false", () => {
    expect(paid.status.code).toBe(InvoiceStatus.PAID);
    expect(isPaid(paid)).toBe(true);
    expect(isOverdue(paid)).toBe(false);
    expect(isCancelled(paid)).toBe(false);
    expect(isPartiallyPaid(paid)).toBe(false);
    expect(canPay(paid)).toBe(false);
    expect(canCancel(paid)).toBe(false);
  });

  it("a real CANCELLED order: isCancelled true, everything else false", () => {
    expect(cancelled.status.code).toBe(InvoiceStatus.CANCELLED);
    expect(isCancelled(cancelled)).toBe(true);
    expect(isPaid(cancelled)).toBe(false);
    expect(isOverdue(cancelled)).toBe(false);
    expect(isPartiallyPaid(cancelled)).toBe(false);
    expect(canPay(cancelled)).toBe(false);
    expect(canCancel(cancelled)).toBe(false);
  });
});

describe("client-orders legacy status rules — the sanctioned construction (AC-18)", () => {
  it("a CANCELLATION_REQUEST record: isCancelled true (design 8.5's one authored row)", () => {
    const record: OrderLike = {
      status: { code: InvoiceStatus.CANCELLATION_REQUEST },
      paid_amount: 0,
      unpaid_amount_converted: 0
    };
    expect(isCancelled(record)).toBe(true);
    expect(isPaid(record)).toBe(false);
    expect(isOverdue(record)).toBe(false);
    expect(isPartiallyPaid(record)).toBe(false);
    expect(canPay(record)).toBe(false);
    expect(canCancel(record)).toBe(false);
  });
});
