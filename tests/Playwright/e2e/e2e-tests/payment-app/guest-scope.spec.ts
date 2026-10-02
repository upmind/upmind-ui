// -----------------------------------------------------------------------------
/**
 * @fileoverview Only a signed-in client is offered a way to pay
 *
 * ## Job To Be Done
 * A signed-in client is offered a way to pay; a visitor with no session is not.
 *
 * ## What Breaks If These Fail
 * A visitor gets a card form that cannot charge, or the client is locked out.
 */

import { newUser } from "../../support/fixtures/auth-context";
import { createUnpaidInvoice } from "../../support/flows/unpaid-invoice";
import { expect } from "@playwright/test";
import { PAYMENT_APP_URL } from "../../../../../playwright.config";
import type { Page } from "@playwright/test";

// -----------------------------------------------------------------------------

function payLink(invoiceId: string) {
  return new URL(`/pay/${invoiceId}`, PAYMENT_APP_URL).toString();
}

async function payableSurface(page: Page) {
  const form = page
    .getByTestId("section")
    .and(page.locator('[data-test-value="payment-details"]'));

  return {
    forms: await form.count(),
    gateways: await page.getByTestId("gateway").count(),
    payControls: await page.getByTestId("button-complete-checkout").count(),
    amounts: await page.getByTestId("pay-amount-value").count(),
    text: (await page.locator("body").innerText()).replace(/\s+/g, " ").trim(),
    landedOn: page.url(),
    html: (await page.locator("body").innerHTML()).slice(0, 400)
  };
}

function describeSurface(surface: Awaited<ReturnType<typeof payableSurface>>) {
  return [
    `forms: ${surface.forms}`,
    `gateways: ${surface.gateways}`,
    `pay controls: ${surface.payControls}`,
    `amounts: ${surface.amounts}`,
    `landed on: ${surface.landedOn}`,
    `text: "${surface.text.slice(0, 300)}"`,
    `body html: "${surface.html}"`
  ].join(" | ");
}

// -----------------------------------------------------------------------------

newUser.describe("who the standalone payment app will take money from", () => {
  newUser(
    "offers no way to pay to a visitor with no client session",
    async ({ page, checkout, confirmation, browser }) => {
      const invoiceId = await createUnpaidInvoice(page, checkout, confirmation);

      const visitor = await browser.newContext();
      const visitorPage = await visitor.newPage();

      const consoleErrors: string[] = [];
      visitorPage.on("console", message => {
        if (message.type() === "error") consoleErrors.push(message.text());
      });
      visitorPage.on("pageerror", error => consoleErrors.push(String(error)));

      try {
        await visitorPage.goto(payLink(invoiceId), {
          waitUntil: "networkidle"
        });
        await visitorPage.waitForTimeout(6000);

        const surface = await payableSurface(visitorPage);
        const looked = describeSurface(surface);

        expect(
          surface.payControls,
          `a visitor with no client session was offered a way to spend money — ${looked}`
        ).toBe(0);
        expect(
          surface.forms,
          `a visitor with no client session was handed a payment form that cannot charge — ${looked}`
        ).toBe(0);
        expect(
          surface.gateways,
          `a visitor with no client session was offered payment methods — ${looked}`
        ).toBe(0);
        expect(
          consoleErrors,
          `the visitor's pay screen logged errors:\n  ${consoleErrors.join("\n  ")}`
        ).toEqual([]);
      } finally {
        await visitor.close();
      }
    }
  );

  newUser(
    "offers the invoice's own client a way to pay it",
    async ({ page, checkout, confirmation }) => {
      const invoiceId = await createUnpaidInvoice(page, checkout, confirmation);

      await page.goto(payLink(invoiceId), { waitUntil: "networkidle" });
      await page.waitForTimeout(6000);

      const surface = await payableSurface(page);
      const looked = describeSurface(surface);

      expect(
        surface.forms,
        `the invoice's own client was refused the payment form — ${looked}`
      ).toBeGreaterThan(0);
      expect(
        surface.gateways,
        `the invoice's own client was offered no payment method — ${looked}`
      ).toBeGreaterThan(0);
      expect(
        surface.amounts,
        `the invoice's own client was never told what is owed — ${looked}`
      ).toBeGreaterThan(0);
    }
  );
});
