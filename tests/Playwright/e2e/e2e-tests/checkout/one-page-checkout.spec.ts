import { test } from "@playwright/test";
import type { Request } from "@playwright/test";
import { newUser, expect } from "../../support/fixtures/auth-context";
import { Basket } from "../../support/page-objects/templates/basket";
import { Checkout } from "../../support/page-objects/templates/checkout";
import {
  interceptCheckoutFlow,
  interceptConfigValues
} from "../../support/mocks/brand";
import {
  createOrder,
  addProductToOrder,
  getCurrentOrder,
  addAddressToClient
} from "../../support/api/index";
import { products } from "../../support/constants/products";
import { URLs } from "../../support/constants/urls";
import { seedGuestBasket } from "../../support/flows/guest-checkout";

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

newUser.describe.configure({ mode: "parallel" });

newUser.describe("One-page checkout", () => {
  newUser.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "wait" });
  });

  // Scenario: The order summary always shows the server-priced basket
  newUser(
    "The order summary always shows the server-priced basket @FE-3002 @smoke",
    async ({ page, context, token }) => {
      const basket = new Basket(page);

      // Given the brand is configured for the one-page checkout flow
      await interceptCheckoutFlow(page, context, "one-page");

      // Given my basket contains a configurable product (quantity is the
      // Hat's inline configuration — proven quantifiable on this brand)
      const order = await createOrder(token);
      await addProductToOrder(
        token,
        order.id,
        products.HAT.id,
        1,
        products.HAT.billingCycle,
        [],
        [],
        {},
        [],
        true,
        false
      );
      await page.goto(URLs.basket);
      // control-flow guard — the one-page order page (Your Order) is rendered
      await expect(basket.yourOrderCard).toBeVisible();

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

      // Then the order summary shows the updated quantity
      await expect(basket.summarySection).toContainText("×2");

      // And the order summary total matches the basket total held by the
      // store — the server-priced order, read back through the same API
      const storeOrder = await getCurrentOrder(token);
      await expect(basket.summaryTotalValue).toHaveText(
        `${storeOrder?.total_amount_formatted}`
      );
    }
  );

  // Scenario: An inline configuration change is saved immediately
  newUser(
    "An inline configuration change is saved immediately @FE-3002",
    async ({ page, context, token }) => {
      const basket = new Basket(page);

      // Given the brand is configured for the one-page checkout flow. The
      // inline term selector needs no brand config — the one-page card
      // activates it, so this also covers that activation.
      await interceptCheckoutFlow(page, context, "one-page");

      // Given my basket contains a configurable product, on its monthly term
      const order = await createOrder(token);
      await addProductToOrder(
        token,
        order.id,
        products.STARTER_HOSTING.id,
        1,
        1,
        [],
        [],
        {},
        [],
        true,
        false
      );
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
      await basket.selectTerm(/Biennially/);
      await saveRequest;
      await saveResponse;
      // control-flow guard — the change registered in the selector
      await expect(basket.termSelector).toContainText("Biennially");

      // Then the new billing term is still applied after I reload the page
      await page.reload();
      await expect(basket.yourOrderCard).toBeVisible();
      await expect(basket.termSelector).toContainText("Biennially");
    }
  );

  // Scenario: Placing an order with required order details incomplete points me at them
  newUser(
    "Placing an order with required order details incomplete points me at them @FE-3002 @smoke",
    async ({ page, context, token, checkout }) => {
      // Given the brand is configured for the one-page checkout flow — and
      // renders its additional order details on the checkout page (the
      // basketFields meta defaults to hidden at the checkout context)
      await interceptCheckoutFlow(page, context, "one-page", {
        "@context.checkout.basketFields": "visible"
      });

      // Given my basket requires additional order details that I have not
      // completed. And my billing details are complete — the registered
      // account already satisfies this brand's billing requirements.
      const order = await createOrder(token);
      await addProductToOrder(
        token,
        order.id,
        products.STARTER_HOSTING.id,
        1,
        products.STARTER_HOSTING.billingCycle,
        [],
        [],
        {},
        [],
        true,
        false
      );
      await page.goto(URLs.checkout);
      // control-flow guard — the checkout settled
      await expect(checkout.paymentDetails).toBeVisible();

      // The additional-details fields are brand-configured (order custom
      // fields), enforced server-side — read the REAL state and skip where the
      // brand ships none (mirrors the captureBrandSettings/skip pattern;
      // mocking them would be journey-data mocking).
      const fieldInputs = await checkout.fieldsForm
        .locator("input, textarea, [role='combobox']")
        .count();
      newUser.skip(
        fieldInputs === 0,
        `No order custom fields configured on this brand (${URLs.baseUrl}) — seed a required checkout field to run this scenario`
      );

      // When I place the order
      await checkout.attemptPlaceOrder();

      // Then I am shown the incomplete additional-details section — the
      // refusal scrolls it into view with its validation showing
      await expect(
        checkout.sectionValidationMessage(checkout.fieldsSection)
      ).toBeVisible();
      await expect(checkout.fieldsSection).toBeInViewport();

      // And the order is not placed — still on the checkout
      await expect(page).toHaveURL(/order\/checkout/);
    }
  );

  // Scenario: Placing an order without billing details points me at the billing section
  newUser(
    "Placing an order without billing details points me at the billing section @FE-3002",
    async ({ page, context, token, checkout }) => {
      // Given the brand is configured for the one-page checkout flow
      await interceptCheckoutFlow(page, context, "one-page");

      // Given I have not provided billing details — the brand requires an
      // address for orders (settings mock) and this fresh account has none
      await interceptConfigValues(page, null, {
        requireAddressForOrders: true
      });
      const order = await createOrder(token);
      await addProductToOrder(
        token,
        order.id,
        products.STARTER_HOSTING.id,
        1,
        products.STARTER_HOSTING.billingCycle,
        [],
        [],
        {},
        [],
        true,
        false
      );
      await page.goto(URLs.checkout);
      // control-flow guard — the checkout settled
      await expect(checkout.paymentDetails).toBeVisible();

      // When I place the order
      await checkout.attemptPlaceOrder();

      // Then I am shown the incomplete billing section — the refusal scrolls
      // it into view and the billing form answers with its field validation
      await expect(
        checkout.sectionValidationMessage(checkout.billingSection)
      ).toBeVisible();
      await expect(checkout.billingSection).toBeInViewport();

      // And the order is not placed — still on the checkout
      await expect(page).toHaveURL(/order\/checkout/);
    }
  );

  // Scenario: A returning customer's saved billing details load after a page refresh
  newUser(
    "A returning customer's saved billing details load after a page refresh @FE-3002",
    async ({ page, context, token, clientId, checkout }) => {
      // Given the brand is configured for the one-page checkout flow
      await interceptCheckoutFlow(page, context, "one-page");

      // Given I am signed in with saved billing details (a returning customer
      // whose address is already on the account)
      await addAddressToClient(token, clientId);

      // And I am on the checkout
      const order = await createOrder(token);
      await addProductToOrder(
        token,
        order.id,
        products.STARTER_HOSTING.id,
        1,
        products.STARTER_HOSTING.billingCycle,
        [],
        [],
        {},
        [],
        true,
        false
      );
      await page.goto(URLs.checkout);
      // control-flow guard — the billing section rendered before the reload
      await expect(checkout.billingSection).toBeVisible();

      // When I reload the page
      await page.reload();

      // Then my saved billing details are shown in the billing section
      await expect(checkout.billingSection).toContainText(/10 Downing Street/);
    }
  );

  // Scenario: A complete one-page order is placed successfully
  newUser(
    "A complete one-page order is placed successfully @FE-3002 @smoke",
    async ({ page, context, token, clientId, checkout }) => {
      // Given the brand is configured for the one-page checkout flow
      await interceptCheckoutFlow(page, context, "one-page");

      // Given my basket, billing details, and product setup are complete
      await addAddressToClient(token, clientId);
      const order = await createOrder(token);
      await addProductToOrder(
        token,
        order.id,
        products.STARTER_HOSTING.id,
        1,
        products.STARTER_HOSTING.billingCycle,
        [],
        [],
        {},
        [],
        true,
        false
      );
      await page.goto(URLs.checkout);

      // When I place the order (a real card payment through Stripe)
      await checkout.selectPaymentMethod("Stripe");
      await checkout.inputStripeDetails("4242424242424242", "12/50", "123");
      await checkout.clickCompleteCheckout();

      // Then the order is confirmed
      await expect(page.getByText("Thank you for your order.")).toBeVisible();
    }
  );
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

    // Given the brand is configured for the one-page checkout flow
    await interceptCheckoutFlow(page, context, "one-page");

    // Given I am browsing as a guest with a product in my basket
    await seedGuestBasket(page, context);

    // When I open the checkout
    await page.goto(URLs.checkout);

    // Then the billing section offers the guest billing form — the entry form
    // variant, not the saved-details summary
    await expect(checkout.billingSection).toBeVisible();
    await expect(checkout.billingForm).toBeVisible();
  });
});
