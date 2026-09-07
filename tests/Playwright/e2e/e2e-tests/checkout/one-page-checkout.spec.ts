import { test, expect } from "@playwright/test";
import type { Request } from "@playwright/test";
import { Basket } from "../../support/page-objects/templates/basket";
import { Checkout } from "../../support/page-objects/templates/checkout";
import {
  captureBrandSettings,
  interceptCheckoutFlow
} from "../../support/mocks/brand";
import { GuestCheckout } from "../../support/page-objects/templates/guest-checkout";
import {
  addProductViaHeadless,
  getBasketViaHeadless,
  addBillingAddressViaHeadless,
  registerClientViaHeadless,
  seedGuestBasket,
  waitForProductConfigQuietViaHeadless
} from "../../support/flows";
import { products } from "../../support/constants/products";
import { gateways } from "../../support/constants/gateways";
import { URLs } from "../../support/constants/urls";
import type { AddressModel } from "@upmind-automation/headless";

// -----------------------------------------------------------------------------
/**
 * @fileoverview One-page checkout (FE-3002) e2e coverage.
 *
 * ## Job To Be Done
 * Prove the reworked one-page checkout against the real headless/client-vue
 * modules: the order summary always prices the SAVED basket (inline edits save
 * immediately, no batch commit), Place Order never dead-clicks (a refusal
 * surfaces the incomplete section), saved billing survives a refresh, guests
 * are offered the guest billing form, and a complete one-page order places.
 *
 * Implements `tests/Playwright/features/checkout/one-page-checkout.feature`
 * (one test per Scenario). The Background — "the brand is configured for the
 * one-page checkout flow" — is a settings mock (`interceptCheckoutFlow`), not
 * journey data.
 *
 * ## What Breaks If These Fail
 * - The summary drifts from what the customer is charged (unsaved local edits
 *   shown), or inline edits are lost on refresh/abandon.
 * - Place Order silently dead-clicks on incomplete fields/billing instead of
 *   pointing the customer at what's missing.
 * - Returning customers lose their saved billing after a refresh; guests are
 *   never offered a billing form at all.
 * - The whole reworked funnel/gating path regresses (final journey test).
 */

// NB: no `name` — a `name` on the model triggers the Google address-search
// path, which asynchronously re-derives the address and clobbers these fields.
const SEEDED_ADDRESS: AddressModel = {
  address: {
    address1: "10 Downing Street",
    address2: "",
    city: "London",
    postcode: "SW1A 2AB",
    countryId: "320e4357-95e7-8d18-484f-31643202d986",
    regionId: "de78642d-e539-7146-295f-21208469530d"
  }
};

/** True for basket writes — order mutations the inline editors save through. */
function isBasketWrite(request: Request): boolean {
  const isWriteMethod = ["POST", "PUT", "PATCH"].includes(request.method());
  const isOrderEndpoint = /\/api\/orders\/[^/]+/.test(request.url());
  return isWriteMethod && isOrderEndpoint;
}

/** True when the request body carries `"key":value` (flat or nested). */
function payloadCarries(
  request: Request,
  key: string,
  value: unknown
): boolean {
  const raw = request.postData() ?? "";
  return raw.includes(`"${key}":${JSON.stringify(value)}`);
}

test.describe.configure({ mode: "parallel" });

test.describe("One-page checkout", () => {
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "wait" });
  });

  // Scenario: The order summary always shows the server-priced basket
  test("The order summary always shows the server-priced basket @FE-3002 @smoke", async ({
    page,
    context
  }) => {
    const basket = new Basket(page);

    // Given the brand is configured for the one-page checkout flow
    await interceptCheckoutFlow(page, context, "one-page");
    // Brand settings/config are static and persisted from the first boot
    // (brand.services.ts:79-83 since 16a5d5d9e9), so the mock must be armed
    // before the app loads — hence plain `test` + an explicit boot here.
    await page.goto(URLs.baseUrl);
    await registerClientViaHeadless(page);

    // Given my basket contains a configurable product (quantity is the
    // Hat's inline configuration — proven quantifiable on this brand)
    const { basketProductId } = await addProductViaHeadless(page, {
      productId: products.HAT.id,
      billingCycleMonths: products.HAT.billingCycle
    });
    await page.goto(URLs.basket);
    // control-flow guard — the one-page order page (Your Order) is rendered
    await expect(basket.yourOrderCard).toBeVisible();

    // control-flow guard — gate on the card's product-config actor settling
    // before clicking. The basket's first poll sends that actor through
    // refresh/re-check, which disables and re-renders the stepper; a click
    // dispatched into that state flip lands on a node swapped out under it, so
    // the increment handler never runs — no quantity change, no re-price, no
    // PUT. The actor publishes reliably only once settled, so gate on that
    // (same phenomenon clickCompleteCheckout guards).
    if (!basketProductId) {
      throw new Error(
        "one-page-checkout: addProductViaHeadless returned no basketProductId to gate on"
      );
    }
    await waitForProductConfigQuietViaHeadless(page, { basketProductId });

    // When I increase the product quantity on the order page. The inline
    // edit saves immediately — assert the whole mutation chain, not just
    // the end state.
    const saveRequest = page.waitForRequest(
      request =>
        isBasketWrite(request) && payloadCarries(request, "quantity", 2)
    );
    const saveResponse = page.waitForResponse(
      response =>
        isBasketWrite(response.request()) &&
        payloadCarries(response.request(), "quantity", 2) &&
        response.ok()
    );
    await basket.quantityIncrement.click();
    await saveRequest;
    await saveResponse;
    // control-flow guard — the change registered in the input
    await expect(basket.quantityInput).toHaveValue("2");

    // Then the order summary shows the updated quantity — the ×N line of the
    // per-product breakdown, which the brand's own `basketSummaryDetails`
    // summary setting shows or hides (hidden by default) independently of the
    // checkout flow. Read the app's resolved setting for this context and
    // assert the breakdown only where the brand shows it.
    const showsBreakdown = await page.evaluate(
      () =>
        window.Upmind!.useConfig({ context: window.Upmind!.UIContext.BASKET })
          .ui.basketSummaryDetails.isVisible
    );
    if (showsBreakdown) {
      await expect(
        basket.summarySection.getByTestId("basket-summary-breakdown")
      ).toContainText("×2");
    }

    // And the order page's total matches the basket total held by the
    // store — the server-priced order, read back through the same API
    const storeOrder = await getBasketViaHeadless(page);
    await expect(basket.basketTotalValue).toHaveText(
      `${storeOrder?.total_amount_formatted}`
    );
  });

  // Scenario: An inline configuration change is saved immediately
  test("An inline configuration change is saved immediately @FE-3002", async ({
    page,
    context
  }) => {
    const basket = new Basket(page);

    // Given the brand is configured for the one-page checkout flow. The
    // inline term selector needs no brand config — the one-page card
    // activates it, so this also covers that activation.
    await interceptCheckoutFlow(page, context, "one-page");
    await page.goto(URLs.baseUrl);
    await registerClientViaHeadless(page);

    // Given my basket contains a configurable product, on its monthly term
    await addProductViaHeadless(page, {
      productId: products.STARTER_HOSTING.id,
      billingCycleMonths: 1
    });
    await page.goto(URLs.basket);
    // control-flow guard — the one-page order page (Your Order) is rendered
    await expect(basket.yourOrderCard).toBeVisible();

    // When I change the product's billing term on the order page. The edit
    // saves immediately — assert the outgoing save carries the new term and
    // the server accepts it (whole chain, not just the end state).
    const saveRequest = page.waitForRequest(
      request =>
        isBasketWrite(request) &&
        payloadCarries(request, "billing_cycle_months", 24)
    );
    const saveResponse = page.waitForResponse(
      response =>
        isBasketWrite(response.request()) &&
        payloadCarries(response.request(), "billing_cycle_months", 24) &&
        response.ok()
    );
    await basket.selectTerm(24);
    await saveRequest;
    await saveResponse;
    // control-flow guard — the change registered in the selector (the trigger
    // shows the parsed cycle label; en run)
    await expect(basket.termSelector).toContainText(/2-year/);

    // Then the new billing term is still applied after I reload the page
    await page.reload();
    await expect(basket.yourOrderCard).toBeVisible();
    await expect(basket.termSelector).toContainText(/2-year/);
  });

  // Scenario: Placing an order with required order details incomplete points me at them
  test("Placing an order with required order details incomplete points me at them @FE-3002 @smoke", async ({
    page,
    context
  }) => {
    const checkout = new Checkout(page);
    // Given the brand is configured for the one-page checkout flow — and
    // renders its additional order details on the checkout page (the
    // basketFields meta defaults to hidden at the checkout context)
    await interceptCheckoutFlow(page, context, "one-page", {
      "@context.checkout.basketFields": "visible"
    });
    await page.goto(URLs.baseUrl);
    await registerClientViaHeadless(page);

    // Given my basket requires additional order details that I have not
    // completed. And my billing details are complete — the registered
    // account already satisfies this brand's billing requirements.
    await addProductViaHeadless(page, {
      productId: products.STARTER_HOSTING.id,
      billingCycleMonths: products.STARTER_HOSTING.billingCycle
    });
    await page.goto(URLs.checkout);
    // control-flow guard — the checkout settled
    await expect(checkout.paymentDetails).toBeVisible();

    // The additional-details fields are brand-configured (order custom
    // fields), enforced server-side — read the REAL state and skip where the
    // brand ships none (mirrors the captureBrandSettings/skip pattern;
    // mocking them would be journey-data mocking).
    const fieldInputs = await checkout.fieldsForm
      .locator(
        "input[required], textarea[required], [role='combobox'][aria-required='true']"
      )
      .count();
    test.skip(
      fieldInputs === 0,
      `No order custom fields configured on this brand (${URLs.baseUrl}) — seed a required checkout field to run this scenario`
    );

    // When I place the order — Place Order mounts once a payment method is
    // chosen (usePaymentDetail showPaymentActions)
    await checkout.selectGatewayByType(gateways.BANK_TRANSFER);
    await checkout.attemptPlaceOrder();

    // Then I am shown the incomplete additional-details section — the
    // refusal scrolls it into view with its validation showing
    await expect(
      checkout.sectionValidationMessage(checkout.fieldsSection)
    ).toBeVisible();
    await expect(checkout.fieldsSection).toBeInViewport();

    // And the order is not placed — still on the checkout
    await expect(page).toHaveURL(/order\/checkout/);
  });

  // Scenario: Placing an order without billing details points me at the billing section
  test("Placing an order without billing details points me at the billing section @FE-3002", async ({
    page,
    context
  }) => {
    const checkout = new Checkout(page);
    // Given the brand is configured for the one-page checkout flow, and
    // requires an address for orders (one settings mock — a second
    // brand-config handler would shadow the flow) — this fresh account has none
    await interceptCheckoutFlow(
      page,
      context,
      "one-page",
      {},
      { requireAddressForOrders: true }
    );
    await page.goto(URLs.baseUrl);
    await registerClientViaHeadless(page);

    // Given I have not provided billing details
    await addProductViaHeadless(page, {
      productId: products.STARTER_HOSTING.id,
      billingCycleMonths: products.STARTER_HOSTING.billingCycle
    });
    await page.goto(URLs.checkout);
    // control-flow guard — the checkout settled
    await expect(checkout.paymentDetails).toBeVisible();

    // When I place the order — Place Order mounts once a payment method is
    // chosen (usePaymentDetail showPaymentActions)
    await checkout.selectGatewayByType(gateways.BANK_TRANSFER);
    await checkout.attemptPlaceOrder();

    // Then I am shown the incomplete billing section — the refusal scrolls
    // it into view and the billing form answers with its field validation
    await expect(
      checkout.sectionValidationMessage(checkout.billingSection)
    ).toBeVisible();
    await expect(checkout.billingSection).toBeInViewport();

    // And the order is not placed — still on the checkout
    await expect(page).toHaveURL(/order\/checkout/);
  });

  // Scenario: A returning customer's saved billing details load after a page refresh
  test("A returning customer's saved billing details load after a page refresh @FE-3002", async ({
    page,
    context
  }) => {
    const checkout = new Checkout(page);
    // Given the brand is configured for the one-page checkout flow
    await interceptCheckoutFlow(page, context, "one-page");
    await page.goto(URLs.baseUrl);
    const { id: clientId } = await registerClientViaHeadless(page);

    // Given I am signed in with saved billing details (a returning customer
    // whose address is already on the account AND committed to the order —
    // the summary keys off the order's billing model)
    await addProductViaHeadless(page, {
      productId: products.STARTER_HOSTING.id,
      billingCycleMonths: products.STARTER_HOSTING.billingCycle
    });
    await addBillingAddressViaHeadless(page, clientId, SEEDED_ADDRESS);

    // And I am on the checkout
    await page.goto(URLs.checkout);
    // control-flow guard — the billing section rendered before the reload
    await expect(checkout.billingSection).toBeVisible();

    // When I reload the page
    await page.reload();

    // Then my saved billing details are shown in the billing section
    await expect(checkout.billingSection).toContainText(/10 Downing Street/);
  });

  // Scenario: A complete one-page order is placed successfully
  test("A complete one-page order is placed successfully @FE-3002 @smoke", async ({
    page,
    context
  }) => {
    const checkout = new Checkout(page);
    // Given the brand is configured for the one-page checkout flow
    await interceptCheckoutFlow(page, context, "one-page");
    await page.goto(URLs.baseUrl);
    const { id: clientId } = await registerClientViaHeadless(page);

    // Given my basket, billing details, and product setup are complete
    await addProductViaHeadless(page, {
      productId: products.STARTER_HOSTING.id,
      billingCycleMonths: products.STARTER_HOSTING.billingCycle
    });
    await addBillingAddressViaHeadless(page, clientId, SEEDED_ADDRESS);
    await page.goto(URLs.checkout);

    // When I place the order (a real card payment through Stripe)
    await checkout.selectGatewayByType(gateways.STRIPE);
    await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
    await checkout.clickCompleteCheckout();

    // Then the order is confirmed
    await expect(page.getByTestId("order-confirmation-heading")).toBeVisible({
      timeout: 30000
    });
  });
});

test.describe("One-page checkout — guests", () => {
  test.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "wait" });
  });

  // Scenario: A guest is offered the guest billing form
  test("A guest is offered the guest billing form @FE-3002", async ({
    page,
    context
  }) => {
    const checkout = new Checkout(page);
    const guest = new GuestCheckout(page);

    // Given the brand is configured for the one-page checkout flow
    await interceptCheckoutFlow(page, context, "one-page");

    // Given I am browsing as a guest with a product in my basket. Guest checkout
    // itself is server-enforced (register/guest), so read the REAL flag and skip
    // where the brand has it off — mirrors guest-checkout.spec.
    const settings = captureBrandSettings(page);
    await seedGuestBasket(page);
    const config = await settings;
    test.skip(
      !config["invoices.guest_checkout.enabled"],
      `Guest checkout disabled on this brand (${URLs.baseUrl})`
    );

    // When I open the checkout — guardCheckout hands a session-less visitor to
    // the register step, where continuing as a guest mints the guest client
    await page.goto(URLs.checkout);
    await guest.enterGuestCheckout();
    await expect
      .poll(
        async () =>
          (await context.cookies()).some(c => c.name === "upm_client_session"),
        { timeout: 20000 }
      )
      .toBeTruthy();
    await page.goto(URLs.checkout);

    // Then the billing section offers the guest billing form — the entry form
    // variant, not the saved-details summary
    await expect(checkout.billingSection).toBeVisible();
    await expect(checkout.billingForm).toBeVisible();
  });
});
