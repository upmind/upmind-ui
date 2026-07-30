import { newUser, expect } from "../../support/fixtures/auth-context";
import { Basket } from "../../support/page-objects/templates/basket";
import { interceptCheckoutFlow } from "../../support/mocks/brand";
import { createOrder, addProductToOrder } from "../../support/api/index";
import { products } from "../../support/constants/products";
import { URLs } from "../../support/constants/urls";

// -----------------------------------------------------------------------------
/**
 * @fileoverview Checkout flow selection (FE-3002) e2e coverage.
 *
 * ## Job To Be Done
 * Prove the brand's configured checkout flow is the flow customers get: brand
 * config decides the presentation, a `?flow=` link overrides it for that visit
 * only (nothing persisted), basket contents never vote on the flow, and a
 * brand with no configured flow keeps the classic stepped journey.
 *
 * Implements `tests/Playwright/features/checkout/checkout-flow-selection.feature`
 * (one test per Scenario). Brand flow preconditions are settings mocks
 * (`interceptCheckoutFlow` — the `flow` cart meta plus, for the flow-less
 * brand, the legacy `checkout_flow` setting), not journey data.
 *
 * ## Flow markers
 * The one-page journey presents the inline-configurable "Your Order" card on
 * the order step and a single checkout page carrying billing, payment and
 * summary together; the stepped journey presents the classic read-only basket
 * (no "Your Order" card) with checkout as a separate step.
 *
 * ## What Breaks If These Fail
 * - The resolution ladder overrides the brand's configuration, or the `?flow=`
 *   override channel is lost.
 * - A `?flow=` visit sticks (persisted override) and strands visitors in a
 *   flow the brand never configured.
 * - Basket contents flip the flow mid-journey (per-product voting).
 * - Customers on flow-less brands are bounced from the checkout back to the
 *   basket and can never reach payment.
 */

newUser.describe.configure({ mode: "parallel" });

newUser.describe("Checkout flow selection", () => {
  newUser.afterEach(async ({ page }) => {
    await page.unrouteAll({ behavior: "wait" });
  });

  // Scenario: The brand's configured flow decides the checkout presentation
  newUser(
    "The brand's configured flow decides the checkout presentation @FE-3002 @smoke",
    async ({ page, context, token, checkout }) => {
      const basket = new Basket(page);

      // Given the brand is configured for the one-page checkout flow
      await interceptCheckoutFlow(page, context, "one-page");

      // When a customer with a product in their basket proceeds to checkout
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
      await page.goto(URLs.basket);

      // Then they are presented with the one-page checkout — the order step is
      // the inline-configurable "Your Order" card…
      await expect(basket.yourOrderCard).toBeVisible();

      // …and proceeding lands on the single checkout page carrying billing,
      // payment and summary together
      await basket.proceedToCheckout.click();
      await expect(page).toHaveURL(/order\/checkout/);
      await expect(checkout.billingSection).toBeVisible();
      await expect(checkout.paymentDetails).toBeVisible();
      await expect(basket.summarySection).toBeVisible();
    }
  );

  // Scenario: The flow link parameter overrides the brand default for that visit
  newUser(
    "The flow link parameter overrides the brand default for that visit @FE-3002",
    async ({ page, context, token, checkout }) => {
      const basket = new Basket(page);

      // Given the brand is configured for the stepped checkout flow
      await interceptCheckoutFlow(page, context, "stepped");

      // When a customer enters the shop through a link requesting the
      // one-page flow
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
      await page.goto(`${URLs.basket}?flow=one-page`);

      // Then they are presented with the one-page checkout — the "Your Order"
      // card on the order step…
      await expect(basket.yourOrderCard).toBeVisible();

      // …and (navigating in-app, same visit) the single checkout page with
      // billing, payment and summary together
      await basket.proceedToCheckout.click();
      await expect(page).toHaveURL(/order\/checkout/);
      await expect(checkout.billingSection).toBeVisible();
      await expect(checkout.paymentDetails).toBeVisible();
      await expect(basket.summarySection).toBeVisible();
    }
  );

  // Scenario: A flow override is forgotten on a fresh visit
  newUser(
    "A flow override is forgotten on a fresh visit @FE-3002",
    async ({ page, context, token }) => {
      const basket = new Basket(page);

      // Given the brand is configured for the stepped checkout flow
      await interceptCheckoutFlow(page, context, "stepped");

      // And a customer previously entered through a link requesting the
      // one-page flow
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
      await page.goto(`${URLs.basket}?flow=one-page`);
      // control-flow guard — the override took for that visit
      await expect(basket.yourOrderCard).toBeVisible();

      // When they return to the shop without the flow link (a fresh visit)
      await page.goto(URLs.basket);

      // Then they are presented with the stepped checkout — the classic
      // basket step, with no inline "Your Order" card
      await expect(basket.basketProduct.first()).toBeVisible();
      await expect(basket.yourOrderCard).toHaveCount(0);
    }
  );

  // Scenario: The basket contents do not change the brand's checkout flow
  newUser(
    "The basket contents do not change the brand's checkout flow @FE-3002",
    async ({ page, context, token, checkout }) => {
      const basket = new Basket(page);

      // Given the brand is configured for the one-page checkout flow
      await interceptCheckoutFlow(page, context, "one-page");

      // And the basket contains products from several categories
      // (hosting + apparel)
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

      // When the customer proceeds to checkout
      await page.goto(URLs.basket);

      // Then they are presented with the one-page checkout — the "Your Order"
      // card on the order step…
      await expect(basket.yourOrderCard).toBeVisible();

      // …and the single checkout page with billing, payment and summary
      await basket.proceedToCheckout.click();
      await expect(page).toHaveURL(/order\/checkout/);
      await expect(checkout.billingSection).toBeVisible();
      await expect(checkout.paymentDetails).toBeVisible();
      await expect(basket.summarySection).toBeVisible();
    }
  );

  // Scenario: A brand with no configured flow keeps the classic stepped journey
  newUser(
    "A brand with no configured flow keeps the classic stepped journey @FE-3002 @smoke",
    async ({ page, context, token, checkout }) => {
      const basket = new Basket(page);

      // Given the brand has no checkout flow configured — the `flow` cart
      // meta is blanked AND the legacy `checkout_flow` setting is cleared
      await interceptCheckoutFlow(page, context, null);

      // And the basket does not require additional order details
      // (Starter Hosting carries no required checkout fields)
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

      // When a customer with a product in their basket proceeds to checkout
      await page.goto(URLs.basket);

      // Then they are presented with the stepped checkout — the classic
      // basket step, with no inline "Your Order" card
      await expect(basket.basketProduct.first()).toBeVisible();
      await expect(basket.yourOrderCard).toHaveCount(0);

      // And they can reach the payment step without being returned to the
      // basket
      await basket.proceedToCheckout.click();
      await expect(page).toHaveURL(/order\/checkout/);
      await expect(checkout.paymentDetails).toBeVisible();
      // still on the checkout after payment renders — not bounced back
      await expect(page).toHaveURL(/order\/checkout/);
    }
  );
});
