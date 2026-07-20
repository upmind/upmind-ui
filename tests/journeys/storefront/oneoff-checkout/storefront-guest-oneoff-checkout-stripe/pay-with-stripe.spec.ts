// -----------------------------------------------------------------------------
/**
 * @fileoverview storefront-guest-oneoff-checkout-stripe — SLICE: pay with Stripe.
 *
 * One action-slice of the journey (ADR 025 — e2e stays sliced). With a one-off
 * product already in a guest basket, the visitor proceeds to checkout and is
 * offered Stripe as a payment method. Seeds the basket through the shared
 * headless bridge flow rather than re-driving the add-to-basket UI (that is its
 * own slice).
 */

import { test, expect, type Page } from "@playwright/test";
import { URLs } from "../../../../Playwright/e2e/support/constants/urls";
import { seedGuestBasket } from "../../../../Playwright/e2e/support/flows/guest-checkout";
import { Checkout } from "../../../../Playwright/e2e/support/page-objects/templates/checkout";

test.describe("storefront-guest-oneoff-checkout-stripe: pay with Stripe", () => {
  let page: Page;
  let checkout: Checkout;

  test.beforeEach(async ({ page: p }) => {
    page = p;
    checkout = new Checkout(page);
    // A guest basket carrying the one-off product, seeded via the shared bridge
    // (defaults to the one-off HAT product).
    await seedGuestBasket(page);
  });

  test("Stripe is offered as a payment method at guest checkout", async () => {
    await page.goto(URLs.checkout);

    // Behavioural: the Stripe gateway is present among the offered gateways.
    await expect(checkout.paymentDetails).toBeVisible();
    await expect(
      checkout.gateways.filter({ hasText: /card|stripe/i }).first()
    ).toBeVisible();
  });
});
