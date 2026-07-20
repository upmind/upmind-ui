import { expect } from "@playwright/test";
import { test } from "../../../support/fixtures/test-contexts";
import { Checkout } from "../../../support/page-objects/templates/checkout";
import { goToCheckout } from "../../../support/flows/checkout";
import { products } from "../../../support/constants/products";
import { gateways } from "../../../support/constants/gateways";
import { registerClientViaHeadless } from "../../../support/flows/auth-setup";

let checkout: Checkout;

test.describe("Checkout with Bank Transfer", () => {
  test.beforeEach(async ({ page }) => {
    checkout = new Checkout(page);
    await page.goto("/");
    await registerClientViaHeadless(page);
  });
  test("Pay with Bank Transfer", async ({ page }) => {
    await goToCheckout(page, products.STARTER_HOSTING, null, null);
    await checkout.selectGatewayByType(gateways.BANK_TRANSFER);
    await checkout.clickCompleteCheckout();
    await expect(page.getByTestId("order-confirmation-heading")).toBeVisible();
    // FE-2985 out of scope: bank transfer is a MANUAL gateway. Headless
    // mapPaymentData returns undefined for BANK_TRANSFER, so no /api/payments
    // request ever fires — the order is placed via PATCH /orders/{id}/convert
    // with an EMPTY payment body. No gateway_id or amount reaches the wire on
    // placement (both are resolved server-side / fixed on the invoice), so there
    // is no placement payload to guard here; the end-state confirmation above is
    // the assertion. Payment-payload coverage lives in the Stripe checkout-paths
    // and existing-method specs.
  });
});
