// @vitest-environment happy-dom
// Not jsdom: node's undici fetch rejects jsdom's AbortSignal (vitest #8374).
// -----------------------------------------------------------------------------
/**
 * @fileoverview The payment form is gated on the invoice being available
 *
 * ## Job To Be Done
 * The payment form stays withheld until the invoice is available, and never appears for one the API refuses.
 *
 * ## What Breaks If These Fail
 * A customer fills in a card form that cannot charge, or waits on a spinner forever.
 */

import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { useSessionStore } from "@upmind-automation/headless";
import {
  BOOTED,
  amountShown,
  clearSessionCookies,
  gatewayTiles,
  mountPayment,
  mountResolved,
  payControl,
  paymentForm,
  readableText,
  resolved,
  seedClientSession,
  settle
} from "./mount-payment";
import {
  installBootRoutes,
  otherInvoiceId,
  paidInvoiceId,
  recordedInvoiceId,
  recordedMissingInvoiceStatus,
  recordedPaidInvoice,
  replayRecordedMissingInvoice,
  replayRecordedPaidInvoice
} from "./recorded-pool";
import type { PaymentWrapper } from "./mount-payment";

// -----------------------------------------------------------------------------

const invoiceId = recordedInvoiceId as string;
const missingInvoiceId = otherInvoiceId as string;
const settledInvoiceId = paidInvoiceId as string;

function payableSurface(wrapper: PaymentWrapper) {
  return {
    form: paymentForm(wrapper),
    gateways: gatewayTiles(wrapper),
    payControl: payControl(wrapper).exists(),
    amount: amountShown(wrapper)
  };
}

function describeSurface(wrapper: PaymentWrapper) {
  const surface = payableSurface(wrapper);
  return [
    `form: ${surface.form ? "rendered" : "absent"}`,
    `gateways: ${surface.gateways.length}`,
    `pay control: ${surface.payControl}`,
    `amount: ${surface.amount ?? "none"}`,
    `text: "${readableText(wrapper).slice(0, 200)}"`
  ].join(" | ");
}

// -----------------------------------------------------------------------------

describe("the payment form's state gate", () => {
  beforeEach(async () => {
    clearSessionCookies();
    installBootRoutes();
    await seedClientSession();
  });

  afterEach(() => {
    useSessionStore().useActions().clear();
  });

  // Keep this test first: a later mount of the same invoice reads the query cache, not the gate.
  it("withholds the payment form until the invoice is available, then shows it", async () => {
    const wrapper = mountPayment(invoiceId);

    const whileLoading = payableSurface(wrapper);
    const loadingLooked = describeSurface(wrapper);
    await resolved(wrapper);
    await settle(BOOTED);
    const whenAvailable = payableSurface(wrapper);
    const availableLooked = describeSurface(wrapper);

    expect(
      whileLoading.form,
      `a payment form was rendered before the invoice was available — ${loadingLooked}`
    ).toBeUndefined();
    expect(
      whileLoading.gateways,
      `payment methods were offered before the invoice was available — ${loadingLooked}`
    ).toEqual([]);
    expect(
      whileLoading.payControl,
      `a pay control was offered before the invoice was available — ${loadingLooked}`
    ).toBe(false);
    expect(
      whileLoading.amount,
      `an amount was shown before the invoice was available — ${loadingLooked}`
    ).toBeUndefined();

    expect(
      whenAvailable.form,
      `the payment form never arrived — ${availableLooked}`
    ).toBeTruthy();
    expect(
      whenAvailable.gateways.length,
      `no payment method was ever offered — ${availableLooked}`
    ).toBeGreaterThan(0);
    expect(
      whenAvailable.amount,
      `the customer was never told what the invoice is for — ${availableLooked}`
    ).toBeTruthy();

    wrapper.unmount();
  });

  it("never offers a pay control for an invoice the API cannot find", async () => {
    replayRecordedMissingInvoice();

    const wrapper = await mountResolved(missingInvoiceId);
    await settle(BOOTED);

    const surface = payableSurface(wrapper);
    const looked = describeSurface(wrapper);

    expect(recordedMissingInvoiceStatus).toBe(404);
    expect(
      surface.form,
      `a payment form was rendered for an invoice the API refused — ${looked}`
    ).toBeUndefined();
    expect(
      surface.gateways,
      `payment methods were offered for an invoice the API refused — ${looked}`
    ).toEqual([]);
    expect(
      surface.payControl,
      `a pay control was offered for an invoice the API refused — ${looked}`
    ).toBe(false);
    expect(
      surface.amount,
      `an amount was shown for an invoice the API refused — ${looked}`
    ).toBeUndefined();

    wrapper.unmount();
  });

  it("never offers a pay control for an invoice already paid", async () => {
    replayRecordedPaidInvoice();

    const wrapper = await mountResolved(settledInvoiceId);
    await settle(BOOTED);

    const surface = payableSurface(wrapper);
    const looked = describeSurface(wrapper);

    expect(recordedPaidInvoice?.status?.code).toBe("invoice_paid");
    expect(recordedPaidInvoice?.unpaid_amount).toBe(0);
    expect(
      surface.form,
      `a payment form was rendered for an invoice already paid — ${looked}`
    ).toBeUndefined();
    expect(
      surface.gateways,
      `payment methods were offered for an invoice already paid — ${looked}`
    ).toEqual([]);
    expect(
      surface.payControl,
      `a pay control was offered for an invoice already paid — ${looked}`
    ).toBe(false);
    expect(
      surface.amount,
      `an amount was shown for an invoice already paid — ${looked}`
    ).toBeUndefined();

    wrapper.unmount();
  });
});
