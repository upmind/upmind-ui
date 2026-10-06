/**
 * @fileoverview invoices — the order conditions (design 8.5 truth table)
 *
 * ## Job To Be Done
 * Prove the six exported order conditions a basket consumer reads, row by row
 * of the design 8.5 truth table, each as a literal. Rows 1 to 5 are the
 * recorded orders the order-condition scenarios open; rows 6 and 7 are states
 * staging does not hold, each made from a recorded order with its status
 * alone changed.
 *
 * ## What Breaks If These Fail
 * A cancelled order with a payment on it reads as partly paid, a cancellation
 * request reads as payable, or the pay and cancel gates open on a settled
 * order.
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
import cancelledRecording from "./scenarios/read-a-cancelled-order-as-cancelled/02/get-invoices-id-with-staged-imports-1.json";
import paidRecording from "./scenarios/read-a-paid-order-as-paid/02/get-invoices-id-with-staged-imports-1.json";
import partlyPaidRecording from "./scenarios/read-a-partly-paid-order-as-partly-paid/02/get-invoices-id-with-staged-imports-1.json";
import overdueRecording from "./scenarios/read-an-overdue-order-as-overdue/02/get-invoices-id-with-staged-imports-1.json";
import unpaidRecording from "./scenarios/read-an-unpaid-order-as-due-and-payable/02/get-invoices-id-with-staged-imports-1.json";
import type { IInvoice } from "@upmind-automation/types";

type Recorded = { response: { body: { data: unknown } } };

const order = (recording: unknown): IInvoice =>
  (recording as Recorded).response.body.data as IInvoice;

/** A recorded order with its status code alone changed. */
const withStatus = (recording: unknown, code: string): IInvoice => {
  const raw = order(recording);
  return { ...raw, status: { ...raw.status, code } } as IInvoice;
};

const conditionsOf = (raw: IInvoice) => ({
  isOverdue: isOverdue(raw),
  isPaid: isPaid(raw),
  isCancelled: isCancelled(raw),
  isPartiallyPaid: isPartiallyPaid(raw),
  canPay: canPay(raw),
  canCancel: canCancel(raw)
});

// FE-3237 AC18
describe("AC-34: the order conditions", () => {
  it("row 1: a paid order is paid, and neither gate opens", () => {
    expect(conditionsOf(order(paidRecording))).toEqual({
      isOverdue: false,
      isPaid: true,
      isCancelled: false,
      isPartiallyPaid: false,
      canPay: false,
      canCancel: false
    });
  });

  it("row 2: an unpaid order opens the pay and the cancel gate", () => {
    expect(conditionsOf(order(unpaidRecording))).toEqual({
      isOverdue: false,
      isPaid: false,
      isCancelled: false,
      isPartiallyPaid: false,
      canPay: true,
      canCancel: true
    });
  });

  it("row 3: a part-paid unpaid order is partly paid, and both gates open", () => {
    expect(conditionsOf(order(partlyPaidRecording))).toEqual({
      isOverdue: false,
      isPaid: false,
      isCancelled: false,
      isPartiallyPaid: true,
      canPay: true,
      canCancel: true
    });
  });

  it("row 4: an overdue order is overdue, and both gates open", () => {
    expect(conditionsOf(order(overdueRecording))).toEqual({
      isOverdue: true,
      isPaid: false,
      isCancelled: false,
      isPartiallyPaid: false,
      canPay: true,
      canCancel: true
    });
  });

  it("row 5: a cancelled order is cancelled, and neither gate opens", () => {
    expect(conditionsOf(order(cancelledRecording))).toEqual({
      isOverdue: false,
      isPaid: false,
      isCancelled: true,
      isPartiallyPaid: false,
      canPay: false,
      canCancel: false
    });
  });

  it("row 6: a cancelled part-paid order is not partly paid", () => {
    expect(
      conditionsOf(withStatus(partlyPaidRecording, InvoiceStatus.CANCELLED))
    ).toEqual({
      isOverdue: false,
      isPaid: false,
      isCancelled: true,
      isPartiallyPaid: false,
      canPay: false,
      canCancel: false
    });
  });

  it("row 7: a cancellation request is cancelled, and neither gate opens", () => {
    expect(
      conditionsOf(
        withStatus(cancelledRecording, InvoiceStatus.CANCELLATION_REQUEST)
      )
    ).toEqual({
      isOverdue: false,
      isPaid: false,
      isCancelled: true,
      isPartiallyPaid: false,
      canPay: false,
      canCancel: false
    });
  });
});
