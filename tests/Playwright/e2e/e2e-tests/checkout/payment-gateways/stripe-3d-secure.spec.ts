import { test, expect } from "@playwright/test";
import { fakerEN_GB } from "@faker-js/faker";
import { URLs } from "../../../support/constants/urls";
import { Checkout } from "../../../support/page-objects/templates/checkout";
import { Registration } from "../../../support/page-objects/templates/registration";
import { ThreeDSecureCards } from "../../../support/constants/checkout/payment-cards/3dSecureCards";
import { registerClientViaHeadless } from "../../../support/flows/auth-setup";
import { addProductViaHeadless } from "../../../support/flows/basket-setup";
import { gateways } from "../../../support/constants/gateways";
import { OFFSITE_PAYMENT_TIMEOUT } from "../../../support/constants/timeouts";

let checkout: Checkout;
let registration: Registration;

test.describe("3D Secure Authentication", async () => {
  test.beforeEach(async ({ page, context }) => {
    checkout = new Checkout(page);
    registration = new Registration(page, context);
    await page.goto("/");
    await registerClientViaHeadless(page);
  });
  for (const {
    name,
    cardNumber,
    expiryDate,
    cvcCode,
    declines
  } of ThreeDSecureCards) {
    test(`Stripe Cards - ${name}`, async ({ page }) => {
      // The 3DS challenge round-trips to hooks.stripe.com and back; the
      // confirmation goto below is separately gated on that redirect settling.
      // See OFFSITE_PAYMENT_TIMEOUT for the shared offsite-payment budget.
      test.setTimeout(OFFSITE_PAYMENT_TIMEOUT);
      await page.goto(URLs.basket);
      const { basketId: orderId } = await addProductViaHeadless(page, {
        productId: "3de78642-de53-9714-76df-21208469530d",
        billingCycleMonths: 24,
        provisionFields: {
          domain: `${fakerEN_GB.string.alphanumeric({
            length: { min: 3, max: 15 }
          })}.com`
        }
      });
      await page.goto(URLs.checkout);
      // Capture the placement mutation so a wrong gateway/amount on the
      // POST /api/payments body fails here, not just at the confirmation UI.
      const payments = await checkout.interceptPaymentResponse();
      await checkout.selectGatewayByType(gateways.STRIPE);
      await checkout.inputStripeDetails(cardNumber, expiryDate, cvcCode);
      await checkout.clickCompleteCheckout();
      // The placement POST fires (and returns the SCA challenge) before the
      // 3DS redirect, so assert the gateway/amount reached the wire here —
      // independent of how the challenge itself resolves (FE-2985).
      //
      // clickCompleteCheckout() returns the moment the "Placing your order"
      // dialog appears, which can be while the placement POST is still in
      // flight. Poll the intercepted array until the POST lands rather than
      // reading it synchronously (deterministic race unique to the 3DS path —
      // its offsite redirect means we never gate on the confirmation heading).
      // Every 3DS card fires this placement POST (it is what returns the SCA
      // challenge / decline), so the capture is expected on all four cases.
      await expect
        .poll(() => payments.find(p => p.method === "POST" && p.request), {
          timeout: 15000,
          message: "no POST /api/payments captured on placement"
        })
        .toBeTruthy();
      const placement = payments.find(p => p.method === "POST" && p.request);
      expect(placement?.request?.gateway_id).toBeTruthy();
      expect(Number(placement?.request?.amount)).toBeGreaterThan(0);

      // Stripe.js drives a TOP-LEVEL redirect to its hosted 3DS challenge page
      // (hooks.stripe.com/3d_secure_2/hosted). Wait for THAT navigation to land
      // before simulating the post-3DS return — otherwise the confirmation goto
      // races and is interrupted by Stripe's redirect under parallel load
      // ("Navigation ... is interrupted by another navigation to hooks.stripe.com").
      // The old waitForResponse gate resolved on an early hooks.stripe.com
      // response, before this top-level nav committed — gate on the URL instead.
      await page.waitForURL(/hooks\.stripe\.com/, { timeout: 30000 });
      const origin = new URL(URLs.baseUrl).origin;
      const outcome = declines ? "false" : "true";
      // We can't complete the real challenge headless, so simulate the post-3DS
      // return by navigating to the app's OWN origin (config-derived). Resolve at
      // "commit": the confirmation route consumes ?payment_success then rewrites
      // the URL (drops the query — hence the loose waitForURL below), which would
      // otherwise abort a wait-until-"load" goto. The waitForURL + confirmation
      // assertion below do the real waiting; now that the page is settled on the
      // hosted challenge, this goto cleanly supersedes it.
      await page.goto(
        `${origin}/order/${orderId}/?payment_success=${outcome}`,
        {
          waitUntil: "commit"
        }
      );
      await page.waitForURL(url =>
        url.toString().includes(`/order/${orderId}/`)
      );
      if (declines) {
        // The insufficient-funds card authenticates then declines: the
        // confirmation surfaces the failed payment alert.
        await expect(
          page.getByTestId("confirmation-payment-alert")
        ).toHaveAttribute("data-test-value", "failed", { timeout: 30000 });
      } else {
        await expect(
          page.getByTestId("order-confirmation-heading")
        ).toBeVisible({ timeout: 30000 });
      }
    });
  }
});
