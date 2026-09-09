// -----------------------------------------------------------------------------
/**
 * @fileoverview An auth surface issues no order or basket request — ADR 023 §7
 *
 * ## Job To Be Done
 * A login screen that fetches a basket is what started this phase: mounting
 * `/login` issued an order fetch, the basket-fields catalogue and a provisioning
 * check that no login needs, so a host with no commerce at all could not run it.
 * That harm is a NETWORK fact, and this is the only place it is real — the
 * session bootstrap is app-level, so the surfaces only ask the API for anything
 * once a whole app has booted them. Each route is driven in a fresh browser
 * context against the app's own production build, and EVERY request is recorded.
 *
 * ## What Breaks If These Fail
 * The requests come back on the screen that mints credentials: a wasted round
 * trip for every visitor, and a failed fetch or a hang for any host with no
 * basket store. Nothing else catches it — a build, a type gate and every unit
 * suite stay green, because the cost is only visible in a request log.
 *
 * ## Why the assertion is on the whole request list
 * The residue is reported, not asserted away: the test records what each surface
 * DOES ask for and fails on what it must not, so a new legitimate call is
 * visible in the failure output rather than silently permitted. The bootstrap
 * assertion is what stops silence passing for restraint — a surface that failed
 * to boot asks for nothing at all, and would otherwise pass.
 *
 * ## Predecessor
 * The control this replaces greped the `auth` package's source for `useBasket`,
 * `useOrder` and `provision_fields`. It passed for the whole of the first fix
 * round while all three surfaces still fetched an order and the basket
 * catalogue, because that coupling arrived through a shared composable and no
 * banned literal appeared in the package. Then it failed on correct code,
 * because a comment named one of the terms in prose. The §7 import boundary it
 * was also standing in for is now held by resolution, in
 * `packages/auth/src/__tests__/basket-free.test.ts`.
 */

import { expect, test } from "@playwright/test";

// The root baseURL is the CART's. This control drives the standalone auth
// app, which the same config serves on its own port.
import { AUTH_APP_URL } from "../../../../../playwright.config";

// -----------------------------------------------------------------------------

/** Request paths no auth surface may ask for, whatever code emits them. */
const OFF_LIMITS = {
  ORDERS: /\/orders(\/|\?|$)/,
  BASKETS: /\/baskets(\/|\?|$)/,
  BASKET_FIELDS: /basket_fields/,
  PROVISION_FIELDS: /provision_fields/
} as const;

/**
 * The bootstrap every auth surface DOES issue. Asserting it proves the app
 * really booted and talked to the API, so a surface that failed to load cannot
 * pass this control by asking for nothing.
 */
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
    // The basket pull arrived through the config composable's own load, which
    // settles after `networkidle` reports quiet. Without the wait the harm this
    // control exists for lands after the assertion has already passed.
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
