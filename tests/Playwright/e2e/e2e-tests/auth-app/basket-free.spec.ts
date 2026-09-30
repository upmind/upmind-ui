// -----------------------------------------------------------------------------
/**
 * @fileoverview An auth surface issues no order or basket request.
 *
 * ## Job To Be Done
 * Each auth route, on the auth app's production build, issues its bootstrap and nothing off-limits.
 *
 * ## What Breaks If These Fail
 * The screen that mints credentials fetches a basket; a host with no basket store fails or hangs.
 */

import { expect, test } from "@playwright/test";

import { AUTH_APP_URL } from "../../../../../playwright.config";

// -----------------------------------------------------------------------------

const OFF_LIMITS = {
  ORDERS: /\/orders(\/|\?|$)/,
  BASKETS: /\/baskets(\/|\?|$)/,
  BASKET_FIELDS: /basket_fields/,
  PROVISION_FIELDS: /provision_fields/
} as const;

const REACHED_API = /brand\/settings/;

const SURFACES = ["login", "register", "recover", "signed-in"].map(route =>
  new URL(route, AUTH_APP_URL).toString()
);

// -----------------------------------------------------------------------------

for (const route of SURFACES) {
  test(`${route} issues no order or basket request`, async ({ page }) => {
    const requests: string[] = [];
    page.on("request", request =>
      requests.push(`${request.method()} ${request.url()}`)
    );

    await page.goto(route, { waitUntil: "networkidle" });
    // A basket pull would settle after `networkidle` reports quiet, so wait past it.
    await page.waitForTimeout(4000);

    const offenders = Object.entries(OFF_LIMITS).flatMap(([term, pattern]) =>
      requests
        .filter(request => pattern.test(request))
        .map(r => `${term}: ${r}`)
    );

    expect(
      requests.filter(request => REACHED_API.test(request)),
      `${route} never reached the API — it cannot be shown to have booted`
    ).not.toEqual([]);
    expect(
      offenders,
      `${route} asked for: ${requests.filter(r => r.includes("upmind.io")).join("\n  ")}`
    ).toEqual([]);
  });
}

test("every surface renders content a visitor can read", async ({ page }) => {
  for (const route of SURFACES) {
    await page.goto(route, { waitUntil: "networkidle" });

    const text = await page.locator("body").innerText();

    expect(text.replace(/\s+/g, " ").trim().length, route).toBeGreaterThan(100);
  }
});
