// -----------------------------------------------------------------------------
/**
 * @fileoverview The standalone payment app boots from an invoice id
 *
 * ## Job To Be Done
 * Each surface of the app's production build reaches the API cleanly, and a pay link the API refuses offers no pay form.
 *
 * ## What Breaks If These Fail
 * A customer follows a pay link and gets a swallowed error, a raw i18n key, or a card form for an invoice that cannot be charged.
 */

import { expect, test } from "@playwright/test";
import { PAYMENT_APP_URL } from "../../../../../playwright.config";
import { newUser } from "../../support/fixtures/auth-context";
import type { Page } from "@playwright/test";

// -----------------------------------------------------------------------------

const REACHED_API = /brand\/settings/;

const UNKNOWN_INVOICE_ID = "00000000-0000-4000-8000-000000000000";

const UNKNOWN_INVOICE_READ = new RegExp(`/api/invoices/${UNKNOWN_INVOICE_ID}`);

const LANDING = new URL("/", PAYMENT_APP_URL).toString();
const PAY_UNKNOWN = new URL(
  `/pay/${UNKNOWN_INVOICE_ID}`,
  PAYMENT_APP_URL
).toString();

const SURFACES = [LANDING, PAY_UNKNOWN];

function payForm(page: Page) {
  return page
    .getByTestId("section")
    .and(page.locator('[data-test-value="payment-details"]'));
}

// -----------------------------------------------------------------------------

for (const route of SURFACES) {
  test(`${route} boots, reaches the API and logs no errors`, async ({
    page
  }) => {
    const requests: string[] = [];
    const consoleErrors: string[] = [];
    page.on("request", request => requests.push(request.url()));
    page.on("console", message => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", error => consoleErrors.push(String(error)));

    await page.goto(route, { waitUntil: "networkidle" });
    await page.waitForTimeout(4000);

    expect(
      requests.filter(request => REACHED_API.test(request)),
      `${route} never reached the API — it cannot be shown to have booted`
    ).not.toEqual([]);
    expect(
      consoleErrors,
      `${route} logged errors:\n  ${consoleErrors.join("\n  ")}`
    ).toEqual([]);
  });
}

test("the landing tells a visitor who arrived with no invoice id", async ({
  page
}) => {
  await page.goto(LANDING, { waitUntil: "networkidle" });

  const notice = page.getByTestId("payment-no-invoice");

  await expect(notice).toBeVisible({ timeout: 30000 });
  await expect(notice).not.toHaveText("");
});

newUser("a pay link the API refuses offers no pay form", async ({ page }) => {
  const invoiceAnswer = page
    .waitForResponse(
      response =>
        response.request().method() === "GET" &&
        UNKNOWN_INVOICE_READ.test(response.url()),
      { timeout: 40000 }
    )
    .catch(() => undefined);

  await page.goto(PAY_UNKNOWN, { waitUntil: "networkidle" });
  const answer = await invoiceAnswer;
  await page.waitForTimeout(4000);

  expect(
    answer,
    "the signed-in client's pay link never asked the API for its invoice"
  ).toBeTruthy();
  expect(
    answer?.status(),
    `the API accepted an invoice id no invoice carries: ${answer?.url()}`
  ).toBeGreaterThanOrEqual(400);
  await expect(page.getByTestId("button-complete-checkout")).toHaveCount(0);
  await expect(payForm(page)).toHaveCount(0);
  await expect(page.getByTestId("gateway")).toHaveCount(0);
});

test("an untranslated i18n key never reaches the customer", async ({
  page
}) => {
  await page.goto(LANDING, { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);

  const text = await page.locator("body").innerText();
  const rawKeys = text.match(/\b(?:error|action|text|cart|invoice)\.[a-z_.]+/g);

  expect(rawKeys ?? [], "raw i18n keys are on screen").toEqual([]);
});
