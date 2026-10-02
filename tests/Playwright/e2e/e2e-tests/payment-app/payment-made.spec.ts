// -----------------------------------------------------------------------------
/**
 * @fileoverview invoice id -> a card CHARGED, on the real PROD path
 *
 * ## Job To Be Done
 * A real unpaid invoice's id reaches the standalone app, a real card is charged, and the pay form gives way to the processing screen and then goes.
 *
 * ## What Breaks If These Fail
 * A customer's card is never charged, or the app still offers to pay an invoice the card just paid.
 */

import { expect } from "@playwright/test";
import { newUser } from "../../support/fixtures/auth-context";
import { createUnpaidInvoice } from "../../support/flows/unpaid-invoice";
import { gateways } from "../../support/constants/gateways";
import { PAYMENT_APP_URL } from "../../../../../playwright.config";
import type { Page } from "@playwright/test";

// -----------------------------------------------------------------------------

const CHARGE = /\/payments(\/|\?|$)/;

const CARD_NUMBER = "4242424242424242";
const CARD_EXPIRY = "12/50";
const CARD_CVC = "123";

const MONEY_PATH_TIMEOUT = 180000;

// -----------------------------------------------------------------------------

function payForm(page: Page) {
  return page
    .getByTestId("section")
    .and(page.locator('[data-test-value="payment-details"]'));
}

// -----------------------------------------------------------------------------

newUser.describe("the standalone payment app pays a real invoice", () => {
  newUser(
    "boots from an invoice id and takes the payment",
    async ({ page, checkout, confirmation }) => {
      newUser.setTimeout(MONEY_PATH_TIMEOUT);

      const invoiceId = await createUnpaidInvoice(
        page,
        checkout,
        confirmation,
        gateways.BANK_TRANSFER
      );

      await page.goto(
        new URL(`/pay/${invoiceId}`, PAYMENT_APP_URL).toString(),
        {
          waitUntil: "networkidle"
        }
      );

      const amount = page.getByTestId("pay-amount-value");
      await expect(
        amount,
        "the payment app never showed what is owed on the invoice it was given"
      ).toBeVisible({ timeout: 60000 });
      await expect(amount).not.toHaveText("");

      await expect(
        payForm(page),
        "the invoice offered no pay form before any card was charged — a pass here would be the bank transfer, not a payment"
      ).toBeVisible();

      const stripeTile = page
        .getByTestId("gateway")
        .and(page.locator(`[data-test-value="${gateways.STRIPE}"]`));
      await expect(
        stripeTile,
        "the invoice's own gateway list never reached the standalone app"
      ).toBeVisible({ timeout: 60000 });
      await stripeTile.click();

      await checkout.inputStripeDetails(CARD_NUMBER, CARD_EXPIRY, CARD_CVC);

      const pay = page.getByTestId("button-complete-checkout");
      await expect(
        pay,
        "the gateway never reported the card details complete, so the pay button stayed disabled and no charge was submitted"
      ).toBeEnabled({ timeout: 40000 });

      // Armed before the click: the processing screen can close within a second.
      const processingShown = page
        .getByTestId("interstitial")
        .waitFor({ state: "visible", timeout: 40000 })
        .then(
          () => true,
          () => false
        );
      const submitted = page.waitForRequest(
        request => request.method() === "POST" && CHARGE.test(request.url()),
        { timeout: 40000 }
      );
      await pay.click();
      const charge = await submitted.catch(() => undefined);
      expect(
        charge,
        "the pay button was clicked and no charge request ever left the browser"
      ).toBeTruthy();
      expect(
        await processingShown,
        "the pay form never gave way to the processing screen once the charge started"
      ).toBe(true);

      await expect(
        page.getByTestId("button-complete-checkout"),
        `the card was not charged to completion — ${charge?.method()} ${charge?.url()} went out and the app still offers to pay`
      ).toHaveCount(0, { timeout: 60000 });
      await expect(payForm(page)).toHaveCount(0);
    }
  );

  newUser(
    "keeps the payment form mounted across the charge",
    async ({ page, checkout, confirmation }) => {
      newUser.setTimeout(MONEY_PATH_TIMEOUT);

      const invoiceId = await createUnpaidInvoice(
        page,
        checkout,
        confirmation,
        gateways.OFFLINE
      );

      await page.goto(
        new URL(`/pay/${invoiceId}`, PAYMENT_APP_URL).toString(),
        {
          waitUntil: "networkidle"
        }
      );

      const form = payForm(page);
      await expect(form).toBeVisible({ timeout: 60000 });

      await form.evaluate(node =>
        node.setAttribute("data-mount-stamp", "kept")
      );

      const stripeTile = page
        .getByTestId("gateway")
        .and(page.locator(`[data-test-value="${gateways.STRIPE}"]`));
      await stripeTile.click();
      await expect(form).toHaveAttribute("data-mount-stamp", "kept");

      await checkout.inputStripeDetails(CARD_NUMBER, CARD_EXPIRY, CARD_CVC);

      const pay = page.getByTestId("button-complete-checkout");
      await expect(
        pay,
        "the gateway never reported the card details complete, so the pay button stayed disabled and no charge was submitted"
      ).toBeEnabled({ timeout: 40000 });

      let releaseCharge: (() => void) | undefined;
      const chargeHeld = new Promise<void>(resolve => {
        releaseCharge = resolve;
      });
      // Holds the real charge in flight: once paid, the form goes, so it is read mid-charge.
      await page.route(CHARGE, async route => {
        if (route.request().method() !== "POST") return route.fallback();
        await chargeHeld;
        await route.continue();
      });
      const submitted = page.waitForRequest(
        request => request.method() === "POST" && CHARGE.test(request.url()),
        { timeout: 40000 }
      );

      await pay.click();
      const charge = await submitted.catch(() => undefined);
      expect(
        charge,
        "the pay button was clicked and no charge request ever left the browser"
      ).toBeTruthy();

      await expect(
        form,
        "the payment form was re-created during the charge — a mounted gateway iframe would have been destroyed with it"
      ).toHaveAttribute("data-mount-stamp", "kept");

      releaseCharge?.();
      await page.unrouteAll({ behavior: "wait" });
    }
  );
});
