// -----------------------------------------------------------------------------
/**
 * @fileoverview client-orders — the legacy status/condition rules (unit, AC-18)
 *
 * ## Job To Be Done
 * Pin each row of the design 8.5 truth table on the six new pure functions
 * `isOverdue`, `isPaid`, `isCancelled`, `isPartiallyPaid`, `canPay` and
 * `canCancel`. Each expected value is a literal copied from that table.
 *
 * ## Provenance
 * Captures (`pnpm fixtures:generate client-orders`): paid, cancelled
 * (`paid_amount` 0), unpaid, part-paid, overdue, refunded. The
 * `client-orders.captures` spec proves the state of each one. The staging
 * refunded order carries `paid_amount` 0, not the `> 0` of the table state
 * column. Every expected flag on that row is false either way.
 *
 * Declared constructions (design 8.8), each over a recorded record:
 * - cancellation request: the recorded cancelled read with `status.code` set
 *   to `invoice_cancellation_request` (unit only).
 * - cancelled part-paid: the recorded cancelled read with `paid_amount` and
 *   `unpaid_amount_converted` from the recorded part-paid read.
 *
 * ## What Breaks If These Fail
 * A client sees "Cancel" on an order that cannot be cancelled, or "Pay" on
 * one that is already settled.
 */

import { describe, expect, it } from "vitest";
import { InvoiceStatus } from "@upmind-automation/types";
import {
  canCancel,
  canPay,
  isCancelled,
  isOverdue,
  isPaid,
  isPartiallyPaid
} from "..";
import { captured } from "./client-orders.captures";
import type { IOrder } from "@upmind-automation/types";

// -----------------------------------------------------------------------------

type OrderLike = Pick<
  IOrder,
  "status" | "paid_amount" | "unpaid_amount_converted"
>;

type Flags = {
  isOverdue: boolean;
  isPaid: boolean;
  isCancelled: boolean;
  isPartiallyPaid: boolean;
  canPay: boolean;
  canCancel: boolean;
};

function capture(name: string): OrderLike {
  return captured<{ data: OrderLike }>(name).data;
}

function flagsOf(order: OrderLike): Flags {
  return {
    isOverdue: isOverdue(order),
    isPaid: isPaid(order),
    isCancelled: isCancelled(order),
    isPartiallyPaid: isPartiallyPaid(order),
    canPay: canPay(order),
    canCancel: canCancel(order)
  };
}

const paid = capture("get-invoices-id-case-order-paid");
const cancelled = capture("get-invoices-id-case-order-cancelled-none-paid");
const unpaid = capture("get-invoices-id-case-order-unpaid");
const partPaid = capture("get-invoices-id-case-order-part-paid");
const overdue = capture("get-invoices-id-case-order-overdue");
const refunded = capture("get-invoices-id-case-order-refunded");

const ALL_FALSE: Flags = {
  isOverdue: false,
  isPaid: false,
  isCancelled: false,
  isPartiallyPaid: false,
  canPay: false,
  canCancel: false
};

// -----------------------------------------------------------------------------

describe("client-orders legacy status rules — recorded orders (AC-18)", () => {
  it("paid: isPaid true, every other flag false", () => {
    expect(flagsOf(paid)).toEqual({ ...ALL_FALSE, isPaid: true });
  });

  it("unpaid: canPay and canCancel true, isPartiallyPaid false", () => {
    expect(flagsOf(unpaid)).toEqual({
      ...ALL_FALSE,
      canPay: true,
      canCancel: true
    });
  });

  it("part-paid: isPartiallyPaid, canPay and canCancel true", () => {
    expect(flagsOf(partPaid)).toEqual({
      ...ALL_FALSE,
      isPartiallyPaid: true,
      canPay: true,
      canCancel: true
    });
  });

  it("overdue: isOverdue, canPay and canCancel true", () => {
    expect(flagsOf(overdue)).toEqual({
      ...ALL_FALSE,
      isOverdue: true,
      canPay: true,
      canCancel: true
    });
  });

  it("cancelled with nothing paid: isCancelled true, every other flag false", () => {
    expect(flagsOf(cancelled)).toEqual({ ...ALL_FALSE, isCancelled: true });
  });

  it("refunded: every flag false", () => {
    expect(flagsOf(refunded)).toEqual(ALL_FALSE);
  });
});

describe("client-orders legacy status rules — declared constructions (AC-18)", () => {
  it("cancellation request: isCancelled true, every other flag false", () => {
    const record: OrderLike = {
      ...cancelled,
      status: {
        ...cancelled.status,
        code: InvoiceStatus.CANCELLATION_REQUEST
      }
    };
    expect(flagsOf(record)).toEqual({ ...ALL_FALSE, isCancelled: true });
  });

  it("cancelled part-paid: isPartiallyPaid false, isCancelled true", () => {
    const record: OrderLike = {
      ...cancelled,
      paid_amount: partPaid.paid_amount,
      unpaid_amount_converted: partPaid.unpaid_amount_converted
    };
    expect(flagsOf(record)).toEqual({ ...ALL_FALSE, isCancelled: true });
  });
});
